import { test, expect } from '@playwright/test'

for (const muted of [false, true]) {
  test(`achievement snackbar stays bottom right, dismisses, and respects mute=${muted}`, async ({ page }) => {
    await page.setViewportSize({ width: muted ? 390 : 1280, height: 900 })
    await page.addInitScript(() => {
      const recorded: number[] = []
      Object.assign(window, { achievementSoundNotes: recorded })
      const start = OscillatorNode.prototype.start
      OscillatorNode.prototype.start = function (when?: number) {
        recorded.push(this.frequency.value)
        start.call(this, when)
      }
    })
    await page.clock.install()
    if (muted) {
      await page.goto('/pengaturan')
      await page.getByRole('checkbox', { name: /Efek suara/ }).uncheck()
    }
    await page.goto('/latihan?script=hiragana&kind=letter&mode=relaxed&items=hiragana%3A%E3%81%82')
    await page.getByRole('button', { name: 'Mulai latihan', exact: true }).click()
    await expect(page.locator('#answer')).toBeEditable()
    await page.locator('#answer').fill('a')
    await page.locator('#answer').press('Enter')
    const snackbar = page.getByRole('complementary', { name: 'Achievement baru', exact: true })
    await expect(snackbar).toBeVisible()
    await expect(snackbar).toHaveCSS('position', 'fixed')
    await expect(snackbar.locator('.achievement-badge')).toBeVisible()
    const chimes = () => page.evaluate(() => (window as unknown as { achievementSoundNotes: number[] }).achievementSoundNotes.filter(note => [880, 1109, 1319, 1760].includes(note)))
    if (muted) expect(await chimes()).toEqual([])
    else await expect.poll(chimes).toEqual([880, 1109, 1319, 1760])
    await page.clock.runFor(1000)
    const box = (await snackbar.boundingBox())!
    const width = page.viewportSize()!.width
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(width - box.x - box.width).toBeLessThanOrEqual(24)
    expect(900 - box.y - box.height).toBeLessThanOrEqual(30)
    await snackbar.hover()
    await page.clock.runFor(8000)
    await expect(snackbar).toBeVisible()
    await page.screenshot({ path: `.cache/achievement-snackbar-${muted ? 'mobile-muted' : 'desktop-sound'}.png` })
    await page.mouse.move(0, 0)
    await page.clock.runFor(7500)
    await expect(snackbar).not.toBeVisible()
    await page.getByRole('button', { name: 'Akhiri sesi', exact: true }).click()
    await expect(page).toHaveURL(/\/hasil\//)
    await expect(page.locator('.achievement-alert-dot')).toBeVisible()
    await page.reload()
    await expect(page.locator('.achievement-alert-dot')).toBeVisible()
    await expect(snackbar).not.toBeVisible()
    expect(await chimes()).toEqual([])
  })
}
