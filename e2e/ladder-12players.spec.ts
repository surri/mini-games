import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function createRoomAndGetId(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/#/ladder`)
  await page.click('button:has-text("방 만들기")')
  await page.waitForSelector('input[placeholder="이름 입력"]')
  await page.click('button:has-text("확인")')
  const url = page.url()
  const match = url.match(/#\/ladder/)
  const qrText = await page.locator('p').filter({ hasText: /^[A-Z0-9]{6}$/ }).textContent()
  return qrText!.trim()
}

async function joinAsPlayer(page: Page, roomId: string, name: string, charIndex: number) {
  await page.goto(`${BASE_URL}/#/ladder/join/${roomId}`)
  await page.waitForSelector('input[placeholder="이름 입력"]')
  await page.fill('input[placeholder="이름 입력"]', name)
  const charButtons = page.locator('button').filter({ hasText: /^.$/u })
  await charButtons.nth(charIndex % 12).click()
  await page.click('button:has-text("참가하기")')
  await page.waitForSelector('text=대기 중...')
}

test.describe('사다리 타기 - 12명 테스트', () => {
  test('12명 참가 후 모바일 화면에서 사다리 렌더링 확인', async ({ browser }) => {
    // 모바일 뷰포트 설정 (iPhone 14 Pro)
    const mobileViewport = { width: 393, height: 852 }

    // 호스트 페이지 생성
    const hostContext = await browser.newContext({ viewport: mobileViewport })
    const hostPage = await hostContext.newPage()

    await hostPage.goto(`${BASE_URL}/#/ladder`)
    await hostPage.click('button:has-text("방 만들기")')
    await hostPage.waitForSelector('input[placeholder="이름 입력"]')
    await hostPage.fill('input[placeholder="이름 입력"]', '호스트')
    await hostPage.click('button:has-text("확인")')

    // 방 코드 추출
    await hostPage.waitForSelector('text=대기실')
    const roomCode = await hostPage.locator('p').filter({ hasText: /^[A-Z0-9]{6}$/ }).textContent()
    expect(roomCode).toBeTruthy()
    const roomId = roomCode!.trim()

    console.log(`방 코드: ${roomId}`)

    // 11명 참가자 추가 (호스트 포함 총 12명)
    const playerNames = [
      '참가자1', '참가자2', '참가자3', '참가자4', '참가자5',
      '참가자6', '참가자7', '참가자8', '참가자9', '참가자10', '참가자11',
    ]

    const playerPages: Page[] = []

    for (let i = 0; i < playerNames.length; i++) {
      const ctx = await browser.newContext({
        viewport: mobileViewport,
        storageState: undefined,
      })
      const page = await ctx.newPage()
      await page.goto(`${BASE_URL}/#/ladder/join/${roomId}`)
      await page.waitForSelector('input[placeholder="이름 입력"]')
      await page.fill('input[placeholder="이름 입력"]', playerNames[i])

      const charButtons = page.locator('button').filter({ hasText: /^.$/u })
      const count = await charButtons.count()
      if (count > 0) {
        await charButtons.nth(i % Math.min(count, 12)).click()
      }

      await page.click('button:has-text("참가하기")')
      await page.waitForSelector('text=대기 중...')
      playerPages.push(page)
      console.log(`${playerNames[i]} 참가 완료`)
    }

    // 호스트 화면에서 12명 확인
    await hostPage.waitForTimeout(1000)
    const participantText = await hostPage.locator('h3').textContent()
    console.log(`참가자 현황: ${participantText}`)

    // 대기실 스크린샷 (모바일)
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-12p-lobby-mobile.png', fullPage: true })

    // 게임 시작
    await hostPage.click('button:has-text("사다리 시작!")')
    console.log('사다리 시작!')

    // 카운트다운 대기
    await hostPage.waitForTimeout(4000)

    // 사다리 애니메이션 시작 - SVG 확인
    await hostPage.waitForSelector('svg', { timeout: 5000 })
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-12p-playing-mobile.png', fullPage: true })

    // SVG 내부 세로줄 12개 확인
    const verticalLines = hostPage.locator('svg line[y2]')
    const lineCount = await verticalLines.count()
    console.log(`SVG 라인 수: ${lineCount}`)

    // 참가자 페이지에서도 SVG 확인
    await playerPages[0].waitForSelector('svg', { timeout: 5000 })
    await playerPages[0].screenshot({ path: 'e2e/screenshots/ladder-12p-player-view-mobile.png', fullPage: true })

    // 전체 애니메이션 완료 대기 (12명 x 2.5초 + 간격)
    const totalAnimTime = 12 * 2500 + 11 * 800 + 2000
    console.log(`애니메이션 대기: ${totalAnimTime}ms`)
    await hostPage.waitForTimeout(totalAnimTime)

    // 결과 화면 스크린샷
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-12p-result-mobile.png', fullPage: true })

    // 결과 패널 확인
    const resultPanel = hostPage.locator('text=커피 당첨!')
    await expect(resultPanel.first()).toBeVisible({ timeout: 5000 })

    // 데스크톱 뷰포트 비교 스크린샷
    await hostPage.setViewportSize({ width: 1280, height: 800 })
    await hostPage.waitForTimeout(500)
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-12p-result-desktop.png', fullPage: true })

    console.log('12명 사다리 타기 E2E 테스트 완료!')

    // 정리
    for (const p of playerPages) {
      await p.context().close()
    }
    await hostContext.close()
  })
})
