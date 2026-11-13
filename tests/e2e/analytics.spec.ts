import { test, expect } from '@playwright/test'
import { CONTENT_VERSION } from '../../app/data/content'

for (const width of [1280, 390]) {
  test(`result matrix accumulates history, filters and preserves snapshots at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const config = { language: 'ja', script: 'hiragana', kind: 'letter', group: 'Vokal', mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [] }
    const sessions = ['01', '02', '03'].map((day, index) => ({
      id: `analytics-${index}`, config, contentVersion: CONTENT_VERSION, device: 'keyboard',
      startedAt: `2026-11-${day}T00:00:00Z`, endedAt: `2026-11-${day}T00:01:00Z`,
      activeMs: 60000, status: 'completed', hasPaused: false, queue: ['hiragana:あ'], cursor: 0, unfinished: 0,
      attempts: [0, 1].map(order => ({ id: `analytics-${index}:${order}`, sessionId: `analytics-${index}`, itemId: index === 0 && order === 1 ? 'hiragana:い' : 'hiragana:あ',
        input: index === 0 && order === 0 ? 'a' : 'i', outcome: index === 0 ? 'correct' : 'wrong', accepted: index === 0, assisted: false, responseMs: (order + 1) * 1500, order,
        answeredAt: `2026-11-${day}T00:00:0${order + 1}Z` }))
    }))
    await page.goto('/belajar')
    await page.evaluate(async sessions => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('kanalearn-v1', 1)
        request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('sessions', 'readwrite')
          for (const session of sessions) tx.objectStore('sessions').put(session)
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => reject(tx.error)
        }
      })
    }, sessions)
    await page.goto('/hasil/analytics-1')
    await expect(page.getByRole('heading', { name: 'Rangkuman & matriks latihan' })).toBeVisible()
    await expect(page.locator('.analytics-caption').first()).toContainText('2 sesi')
    await expect(page.locator('.analytics-caption').first()).toContainText('4 jawaban')
    await expect(page.locator('.analytics-matrix tbody tr')).toHaveCount(1)
    await expect(page.locator('.analytics-matrix tbody tr')).toContainText('2 jawaban terakhir salah berturut-turut')
    await page.getByRole('button', { name: 'Detail あ', exact: true }).click()
    await expect(page.locator('.analytics-detail tbody tr')).toHaveCount(3)
    await expect(page.locator('.analytics-detail')).toContainText('“i” 2×')
    await expect(page.getByRole('img', { name: /^Waktu respons tiap soal:/ })).toBeVisible()
    await page.locator('#analytics-scope').selectOption('all')
    await expect(page.locator('.analytics-matrix tbody tr')).toHaveCount(2)
    await page.locator('#analytics-search').fill('い')
    await expect(page.locator('.analytics-matrix tbody tr')).toHaveCount(1)
    await page.locator('#analytics-search').fill('tidak-ada')
    await expect(page.getByRole('status')).toContainText('Belum ada materi yang cocok')
    await page.locator('#analytics-search').clear()
    await page.locator('#analytics-sort').selectOption('time')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    await page.screenshot({ path: `test-results/analytics-${width}.png`, fullPage: true })
    await page.reload()
    await expect(page.locator('.analytics-caption').first()).toContainText('4 jawaban')
    await page.goto('/hasil/analytics-2')
    await expect(page.locator('.analytics-caption').first()).toContainText('6 jawaban')
    expect(errors).toEqual([])
  })
}
