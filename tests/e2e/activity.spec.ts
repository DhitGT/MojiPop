import { test, expect } from '@playwright/test'
import { content, CONTENT_VERSION } from '../../app/data/content'

for (const width of [1280, 390]) {
  test(`daily activity shows details, years and language filtering at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/progres')
    await expect(page.getByRole('heading', { name: 'Aktivitas latihan' })).toBeVisible()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.locator('.activity-tile.is-today').click()
    await expect(page.getByRole('dialog')).toContainText('Belum ada latihan pada hari ini')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    const dates = await page.evaluate(() => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
      const old = new Date(today.getFullYear() - 1, 5, 15, 12)
      const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return { today: today.toISOString(), yesterday: yesterday.toISOString(), old: old.toISOString(), todayKey: key(today), yesterdayKey: key(yesterday), year: today.getFullYear() }
    })
    const item = content.find(item => item.script === 'hiragana' && item.kind === 'letter')!
    const korean = content.find(item => item.script === 'hangul' && item.kind === 'letter')!
    const sessions = [
      { id: 'resumed', startedAt: dates.yesterday, answers: [dates.yesterday, dates.today], item },
      { id: 'today', startedAt: dates.today, answers: [dates.today], item },
      { id: 'old', startedAt: dates.old, answers: [dates.old], item },
      { id: 'korean', startedAt: dates.today, answers: [dates.today], item: korean }
    ].map(entry => ({
      id: entry.id, startedAt: entry.startedAt, endedAt: entry.answers.at(-1), status: 'completed', activeMs: 60000, contentVersion: CONTENT_VERSION,
      config: { language: entry.item.language, script: entry.item.script, kind: 'letter', group: entry.item.group, mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [] },
      device: 'keyboard', hasPaused: false, queue: [entry.item.id], cursor: 0, unfinished: 0,
      attempts: entry.answers.map((answeredAt, order) => ({ id: `${entry.id}:${order}`, sessionId: entry.id, itemId: entry.item.id, order, answeredAt,
        outcome: order === 1 ? 'wrong' : 'correct', accepted: order !== 1, assisted: false, input: 'a', responseMs: 1000 }))
    }))
    await page.evaluate(async sessions => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('kanalearn-v1', 1)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('sessions', 'readwrite')
          sessions.forEach(session => tx.objectStore('sessions').put(session))
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      })
    }, sessions)
    await page.reload()
    const today = page.locator(`[data-date="${dates.todayKey}"]`)
    await expect(today).toHaveAttribute('data-level', '2')
    await expect(today).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await today.click()
    await expect(page.locator('.activity-detail')).toContainText('2 sesi latihan')
    await expect(page.locator('.activity-detail')).toContainText('50% akurasi mandiri')
    await expect(page.locator('.activity-session-links a')).toHaveCount(2)
    const box = await page.getByRole('dialog').boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    await page.screenshot({ path: `test-results/activity-popover-${width}.png` })
    await page.getByRole('button', { name: 'Tutup detail hari' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await today.focus()
    await page.keyboard.press('ArrowUp')
    await expect(page.locator(`[data-date="${dates.yesterdayKey}"]`)).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Enter')
    await expect(page.locator('.activity-detail')).toContainText('1 sesi latihan')
    await expect(page.locator('.activity-detail')).toContainText('100% akurasi mandiri')
    await page.keyboard.press('Escape')
    await page.locator('#activity-year').selectOption(String(dates.year - 1))
    await expect(page.locator(`[data-date="${dates.year - 1}-06-15"]`)).toHaveAttribute('data-level', '1')
    await page.locator('#activity-year').selectOption(String(dates.year))
    await page.getByRole('button', { name: /Korea/ }).click()
    await expect(today).toHaveAttribute('data-level', '1')
    await today.click()
    await expect(page.locator('.activity-detail')).toContainText('1 sesi latihan')
    await page.getByRole('heading', { name: 'Aktivitas latihan' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `test-results/activity-${width}.png`, fullPage: true })
    expect(errors).toEqual([])
  })
}
