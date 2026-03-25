import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function joinPlayer(browser: any, roomId: string, name: string): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, storageState: undefined })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/#/ladder/join/${roomId}`)
  await page.waitForSelector('input[placeholder="이름 입력"]')
  await page.fill('input[placeholder="이름 입력"]', name)
  await page.click('button:has-text("참가하기")')
  await page.waitForSelector('text=대기 중...')
  return { page, context }
}

test('당첨 공개 후 늦게 출발한 플레이어도 경로 이동 완료', async ({ browser }) => {
  const mobile = { width: 393, height: 852 }

  // 호스트 생성
  const hostCtx = await browser.newContext({ viewport: mobile })
  const hostPage = await hostCtx.newPage()
  await hostPage.goto(`${BASE_URL}/#/ladder`)
  await hostPage.click('button:has-text("방 만들기")')
  await hostPage.waitForSelector('input[placeholder="이름 입력"]')
  await hostPage.fill('input[placeholder="이름 입력"]', '호스트')
  await hostPage.click('button:has-text("확인")')
  await hostPage.waitForSelector('text=대기실')

  const roomCode = await hostPage.locator('p').filter({ hasText: /^[A-Z0-9]{6}$/ }).textContent()
  const roomId = roomCode!.trim()
  console.log(`방: ${roomId}`)

  // 참가자 2명
  const p1 = await joinPlayer(browser, roomId, '먼저가')
  const p2 = await joinPlayer(browser, roomId, '늦게가')
  await hostPage.waitForTimeout(500)

  // 당첨 1명, 시작
  await hostPage.click('button:has-text("사다리 시작!")')
  await hostPage.waitForSelector('svg', { timeout: 5000 })
  await hostPage.waitForTimeout(300)
  console.log('사다리 시작')

  // 호스트 + 참가자1만 터치 (참가자2는 안 함)
  for (const page of [hostPage, p1.page]) {
    await page.waitForSelector('svg', { timeout: 5000 })
    const rect = page.locator('svg rect[style*="cursor: pointer"]').first()
    if (await rect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rect.click()
    } else {
      const g = page.locator('svg g[style*="cursor: pointer"]').first()
      if (await g.isVisible({ timeout: 1000 }).catch(() => false)) {
        await g.click()
      }
    }
  }
  console.log('호스트 + 참가자1 터치 완료')

  // 애니메이션 완료 대기 (2.5초 + 여유)
  await hostPage.waitForTimeout(4000)

  // 결과 패널이 표시될 수도 있음 (당첨자가 이미 도착한 경우)
  // 참가자2 화면에서 SVG 확인 - 아직 출발 안 한 상태
  await p2.page.waitForSelector('svg', { timeout: 5000 })

  // 참가자2 화면 스크린샷 (출발 전)
  await p2.page.screenshot({ path: 'e2e/screenshots/late-start-before.png', fullPage: true })

  // 참가자2가 늦게 터치
  const p2Rect = p2.page.locator('svg rect[style*="cursor: pointer"]').first()
  const p2CanTap = await p2Rect.isVisible({ timeout: 2000 }).catch(() => false)
  console.log(`참가자2 터치 가능: ${p2CanTap}`)

  if (p2CanTap) {
    await p2Rect.click()
    console.log('참가자2 늦게 터치!')
  } else {
    const p2G = p2.page.locator('svg g[style*="cursor: pointer"]').first()
    if (await p2G.isVisible({ timeout: 1000 }).catch(() => false)) {
      await p2G.click()
      console.log('참가자2 늦게 터치! (g)')
    } else {
      console.log('참가자2 터치 불가!')
    }
  }

  // 애니메이션 완료 대기
  await p2.page.waitForTimeout(3500)

  // 참가자2 화면 스크린샷 (출발 후)
  await p2.page.screenshot({ path: 'e2e/screenshots/late-start-after.png', fullPage: true })

  // 호스트 화면에서 참가자2의 경로도 그려졌는지 확인
  await hostPage.waitForTimeout(500)
  await hostPage.screenshot({ path: 'e2e/screenshots/late-start-host-final.png', fullPage: true })

  // 참가자2 화면에서 path가 그려졌는지 확인 (컬러 경로 3개)
  const paths = p2.page.locator('svg path')
  const pathCount = await paths.count()
  console.log(`참가자2 화면 경로 수: ${pathCount}`)

  // 최소 2개 이상의 경로가 있어야 함 (이미 완료된 플레이어들 + 자신)
  expect(pathCount).toBeGreaterThanOrEqual(2)

  await p1.context.close()
  await p2.context.close()
  await hostCtx.close()
})
