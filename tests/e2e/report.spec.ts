import { test, expect } from '@playwright/test'
import { content, CONTENT_VERSION } from '../../app/data/content'

test('raport shows real results, filters periods and languages, and links follow-up practice', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/raport')
  await expect(page.getByRole('heading', { name: 'Raportmu menunggu cerita pertama' })).toBeVisible()
  await expect(page).toHaveTitle('Raport belajar · KanaLearn')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  const item = content.find(item => item.script === 'hiragana' && item.kind === 'letter')!
  const startedAt = new Date().toISOString()
  const oldDate = new Date()
  oldDate.setDate(oldDate.getDate() - 12)
  const sessions = [
    { id: 'recent-report', startedAt, outcomes: [...Array(16).fill('correct'), 'wrong', 'wrong', 'assisted', 'skipped'] },
    { id: 'old-report', startedAt: oldDate.toISOString(), outcomes: ['wrong', 'wrong', 'wrong', 'wrong', 'wrong'] }
  ].map(({ outcomes, ...session }) => ({
    ...session, contentVersion: CONTENT_VERSION, device: 'keyboard', status: 'completed', activeMs: 60000,
    config: { language: 'ja', script: 'hiragana', kind: 'letter', group: item.group, mode: 'relaxed', count: outcomes.length, source: 'random', itemIds: [], reviewIds: [] },
    hasPaused: false, queue: [item.id], cursor: outcomes.length, unfinished: 0,
    attempts: outcomes.map((outcome, order) => ({ id: `${session.id}:${order}`, sessionId: session.id, itemId: item.id, order,
      outcome, accepted: outcome === 'correct', assisted: outcome === 'assisted', input: 'a', responseMs: 3000 }))
  }))
  await page.evaluate(async sessions => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('kanalearn-v1', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('sessions', 'readwrite')
        for (const session of sessions) transaction.objectStore('sessions').put(session)
        transaction.oncomplete = () => { db.close(); resolve() }
        transaction.onerror = () => reject(transaction.error)
      }
    })
  }, sessions)
  await page.reload()
  await expect(page.locator('.report-metrics')).toContainText('16 dari 25 jawaban')
  await expect(page.locator('.report-grade > strong')).toHaveText('D')
  await page.getByRole('button', { name: '7 hari', exact: true }).click()
  await expect(page.locator('.report-grade > strong')).toHaveText('B')
  await expect(page.locator('.report-metrics')).toContainText('16 dari 20 jawaban')
  await expect(page.locator('.report-day > strong')).toHaveText(['0', '0', '0', '0', '0', '0', '20'])
  await page.screenshot({ path: 'test-results/report-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Raport Belajar' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/report-mobile.png', fullPage: true })
  await page.getByRole('button', { name: /Korea/ }).click()
  await expect(page.getByRole('heading', { name: 'Raportmu menunggu cerita pertama' })).toBeVisible()
  await page.getByRole('button', { name: /Jepang/ }).click()
  await page.getByRole('link', { name: `Latih ${item.glyph}`, exact: true }).click()
  await expect(page).toHaveURL(/\/latihan\?/)
  expect(new URL(page.url()).searchParams.get('items')).toBe(item.id)
  expect(errors).toEqual([])
})
