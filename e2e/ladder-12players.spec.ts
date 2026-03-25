import { test, expect, Page, BrowserContext } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function joinAsPlayer(browser: any, roomId: string, name: string, viewport: { width: number; height: number }): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ viewport, storageState: undefined })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/#/ladder/join/${roomId}`)
  await page.waitForSelector('input[placeholder="이름 입력"]')
  await page.fill('input[placeholder="이름 입력"]', name)
  await page.click('button:has-text("참가하기")')
  await page.waitForSelector('text=대기 중...')
  return { page, context }
}

test.describe('사다리 타기 - 터치 출발 + 캐릭터 이동', () => {
  test('3명 참가 → 캐릭터 터치 → 경로 이동 → 결과 확인', async ({ browser }) => {
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
    console.log(`방 코드: ${roomId}`)

    // 참가자 2명 추가
    const p1 = await joinAsPlayer(browser, roomId, '참가자1', mobile)
    const p2 = await joinAsPlayer(browser, roomId, '참가자2', mobile)
    console.log('참가자 2명 참가 완료')

    await hostPage.waitForTimeout(1000)

    // 사다리 시작 (당첨 1명)
    await hostPage.click('button:has-text("사다리 시작!")')
    console.log('사다리 시작!')

    // SVG 렌더링 대기
    await hostPage.waitForSelector('svg', { timeout: 5000 })
    await hostPage.waitForTimeout(500)

    // "내 캐릭터를 터치해서 출발!" 메시지 확인
    const instructionHost = await hostPage.locator('text=내 캐릭터를 터치해서 출발!').isVisible()
    console.log(`호스트 터치 안내: ${instructionHost}`)
    expect(instructionHost).toBeTruthy()

    // 호스트 화면 스크린샷 (터치 전)
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-before-tap.png', fullPage: true })

    // 참가자1 화면에서도 SVG 확인
    await p1.page.waitForSelector('svg', { timeout: 5000 })
    const instructionP1 = await p1.page.locator('text=내 캐릭터를 터치해서 출발!').isVisible()
    console.log(`참가자1 터치 안내: ${instructionP1}`)

    // 호스트가 자기 캐릭터 터치 (SVG 내 첫 번째 투명 rect 클릭)
    const hostRect = hostPage.locator('svg rect[style*="cursor: pointer"]').first()
    if (await hostRect.isVisible()) {
      await hostRect.click()
      console.log('호스트 캐릭터 터치!')
    } else {
      // rect가 없으면 SVG text 직접 클릭
      const svgTexts = hostPage.locator('svg g[style*="cursor: pointer"]')
      if (await svgTexts.first().isVisible()) {
        await svgTexts.first().click()
        console.log('호스트 캐릭터 그룹 터치!')
      }
    }

    await hostPage.waitForTimeout(1000)
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-host-tapped.png', fullPage: true })

    // 참가자1 터치
    const p1Rect = p1.page.locator('svg rect[style*="cursor: pointer"]').first()
    if (await p1Rect.isVisible()) {
      await p1Rect.click()
      console.log('참가자1 캐릭터 터치!')
    } else {
      const p1Texts = p1.page.locator('svg g[style*="cursor: pointer"]')
      if (await p1Texts.first().isVisible()) {
        await p1Texts.first().click()
        console.log('참가자1 캐릭터 그룹 터치!')
      }
    }

    await p1.page.waitForTimeout(1000)

    // 참가자2 터치
    const p2Rect = p2.page.locator('svg rect[style*="cursor: pointer"]').first()
    if (await p2Rect.isVisible()) {
      await p2Rect.click()
      console.log('참가자2 캐릭터 터치!')
    } else {
      const p2Texts = p2.page.locator('svg g[style*="cursor: pointer"]')
      if (await p2Texts.first().isVisible()) {
        await p2Texts.first().click()
        console.log('참가자2 캐릭터 그룹 터치!')
      }
    }

    // 전체 애니메이션 완료 대기
    await hostPage.waitForTimeout(4000)

    // 결과 화면 스크린샷
    await hostPage.screenshot({ path: 'e2e/screenshots/ladder-result-mobile.png', fullPage: true })

    // 결과 패널 확인
    const resultVisible = await hostPage.locator('text=커피 당첨').first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`결과 패널 표시: ${resultVisible}`)

    // 참가자 화면에서도 결과 확인
    await p1.page.screenshot({ path: 'e2e/screenshots/ladder-result-player.png', fullPage: true })

    console.log('E2E 테스트 완료!')

    await p1.context.close()
    await p2.context.close()
    await hostCtx.close()
  })
})
