import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function joinPlayer(browser: any, roomId: string, name: string): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    storageState: undefined,
  })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/mini-games/ladder/${roomId}`)
  await page.waitForSelector('input[placeholder="이름 입력"]')
  await page.fill('input[placeholder="이름 입력"]', name)
  await page.click('button:has-text("참가하기")')
  await page.waitForSelector('text=대기 중...')
  return { page, context }
}

test('12명 모바일 사다리 UI 깨짐 확인', async ({ browser }) => {
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

  // 11명 참가
  const guests: { page: Page; context: BrowserContext }[] = []
  for (let i = 1; i <= 11; i++) {
    const g = await joinPlayer(browser, roomId, `플레이어${i}`)
    guests.push(g)
  }
  console.log('11명 참가 완료 (총 12명)')

  await hostPage.waitForTimeout(500)

  // 대기실 스크린샷
  await hostPage.screenshot({ path: 'e2e/screenshots/12p-lobby.png', fullPage: true })

  // 당첨 2명, 시작
  // 당첨 인원 2 선택
  const btn2 = hostPage.locator('button:has-text("2")').first()
  if (await btn2.isVisible()) await btn2.click()

  await hostPage.click('button:has-text("사다리 시작!")')
  await hostPage.waitForSelector('svg', { timeout: 5000 })
  await hostPage.waitForTimeout(500)

  // 사다리 생성 직후 - 12명 캐릭터 배치 확인
  await hostPage.screenshot({ path: 'e2e/screenshots/12p-before-tap.png', fullPage: true })

  // SVG 크기 확인
  const svgBox = await hostPage.locator('svg').first().boundingBox()
  console.log(`SVG 크기: ${svgBox?.width?.toFixed(0)}x${svgBox?.height?.toFixed(0)}`)

  // 모든 플레이어 터치 (호스트 + 참가자들)
  for (const page of [hostPage, ...guests.map(g => g.page)]) {
    await page.waitForSelector('svg', { timeout: 5000 })
    const rect = page.locator('svg rect[style*="cursor: pointer"]').first()
    if (await rect.isVisible({ timeout: 1500 }).catch(() => false)) {
      await rect.click()
    }
  }
  console.log('전원 터치 완료')

  // 애니메이션 완료 대기
  await hostPage.waitForTimeout(4000)

  // 결과 화면 스크린샷
  await hostPage.screenshot({ path: 'e2e/screenshots/12p-result.png', fullPage: true })

  // 참가자 화면도 확인
  await guests[0].page.screenshot({ path: 'e2e/screenshots/12p-result-guest.png', fullPage: true })

  // 결과 패널 확인
  const resultVisible = await hostPage.locator('text=커피 사세요').isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`결과 패널: ${resultVisible}`)

  // SVG 내 세로선 12개 확인
  const vlines = await hostPage.locator('svg line').count()
  console.log(`SVG 라인 수: ${vlines}`)

  // 캐릭터 12개 확인 (SVG text 요소)
  const chars = await hostPage.locator('svg text').count()
  console.log(`SVG 텍스트 수: ${chars}`)

  // 다른 해상도에서도 확인
  // iPhone SE (작은 화면)
  await hostPage.setViewportSize({ width: 375, height: 667 })
  await hostPage.waitForTimeout(300)
  await hostPage.screenshot({ path: 'e2e/screenshots/12p-result-iphoneSE.png', fullPage: true })

  // Galaxy Fold (좁은 화면)
  await hostPage.setViewportSize({ width: 280, height: 653 })
  await hostPage.waitForTimeout(300)
  await hostPage.screenshot({ path: 'e2e/screenshots/12p-result-fold.png', fullPage: true })

  expect(resultVisible).toBeTruthy()

  for (const g of guests) await g.context.close()
  await hostCtx.close()
})
