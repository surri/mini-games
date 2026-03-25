import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test('참가자에게도 커피 당첨 팝업이 표시되는지 확인', async ({ browser }) => {
  const mobile = { width: 393, height: 852 }

  // 호스트
  const hostCtx = await browser.newContext({ viewport: mobile })
  const hostPage = await hostCtx.newPage()
  await hostPage.goto(`${BASE_URL}/mini-games/ladder`)
  await hostPage.click('button:has-text("방 만들기")')
  await hostPage.waitForSelector('input[placeholder="이름 입력"]')
  await hostPage.fill('input[placeholder="이름 입력"]', '호스트')
  await hostPage.click('button:has-text("확인")')
  await hostPage.waitForSelector('text=대기실')

  const roomCode = await hostPage.locator('p').filter({ hasText: /^[A-Z0-9]{6}$/ }).textContent()
  const roomId = roomCode!.trim()
  console.log(`방: ${roomId}`)

  // 참가자
  const guestCtx = await browser.newContext({ viewport: mobile, storageState: undefined })
  const guestPage = await guestCtx.newPage()
  await guestPage.goto(`${BASE_URL}/mini-games/ladder/${roomId}`)
  await guestPage.waitForSelector('input[placeholder="이름 입력"]')
  await guestPage.fill('input[placeholder="이름 입력"]', '참가자')
  await guestPage.click('button:has-text("참가하기")')
  await guestPage.waitForSelector('text=대기 중...')
  console.log('참가자 참가 완료')

  await hostPage.waitForTimeout(500)

  // 사다리 시작
  await hostPage.click('button:has-text("사다리 시작!")')
  await hostPage.waitForSelector('svg', { timeout: 5000 })
  await guestPage.waitForSelector('svg', { timeout: 5000 })
  await hostPage.waitForTimeout(300)
  console.log('사다리 시작')

  // 양쪽 모두 터치
  for (const page of [hostPage, guestPage]) {
    const rect = page.locator('svg rect[style*="cursor: pointer"]').first()
    if (await rect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rect.click()
    }
  }
  console.log('양쪽 모두 터치')

  // 애니메이션 완료 대기
  await hostPage.waitForTimeout(4000)

  // 호스트 결과 확인
  const hostResult = await hostPage.locator('text=커피 당첨').first().isVisible().catch(() => false)
  console.log(`호스트 결과 패널: ${hostResult}`)
  await hostPage.screenshot({ path: 'e2e/screenshots/guest-result-host.png', fullPage: true })

  // 참가자 결과 확인
  const guestResult = await guestPage.locator('text=커피 당첨').first().isVisible().catch(() => false)
  console.log(`참가자 결과 패널: ${guestResult}`)
  await guestPage.screenshot({ path: 'e2e/screenshots/guest-result-guest.png', fullPage: true })

  // 추가 대기 후 재확인
  if (!guestResult) {
    await guestPage.waitForTimeout(3000)
    const guestRetry = await guestPage.locator('text=커피 당첨').first().isVisible().catch(() => false)
    console.log(`참가자 결과 패널 (재확인): ${guestRetry}`)
    await guestPage.screenshot({ path: 'e2e/screenshots/guest-result-guest-retry.png', fullPage: true })

    // room status 디버깅
    const pageContent = await guestPage.content()
    const hasFinished = pageContent.includes('finished')
    const hasSvg = await guestPage.locator('svg').isVisible()
    console.log(`SVG 표시: ${hasSvg}`)
  }

  expect(hostResult).toBeTruthy()
  expect(guestResult || await guestPage.locator('text=커피 당첨').first().isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy()

  await guestCtx.close()
  await hostCtx.close()
})
