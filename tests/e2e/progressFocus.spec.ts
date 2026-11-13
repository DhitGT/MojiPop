import { test, expect } from '@playwright/test'
import { content, CONTENT_VERSION } from '../../app/data/content'

test('progress summarizes combinations, links targeted practice and follows language at mobile width', async ({ page }) => {
  await page.goto('/progres')
  const item = content.find(item => item.script === 'hiragana' && item.group === 'Kombinasi kecil')!
  const session = {
    id: 'focus', contentVersion: CONTENT_VERSION, device: 'keyboard',
    config: { language: 'ja', script: 'hiragana', kind: 'letter', group: item.group, mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [] },
    startedAt: '2026-11-01T00:00:00Z', status: 'completed', activeMs: 3000, hasPaused: false, queue: [item.id], cursor: 0, unfinished: 0,
    attempts: ['wrong', 'wrong', 'assisted'].map((outcome, order) => ({
      id: `focus:${order}`, sessionId: 'focus', itemId: item.id, order, outcome,
      accepted: outcome === 'assisted', assisted: outcome === 'assisted', input: 'ka', responseMs: 1000
    }))
  }
  await page.evaluate(async session => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('kanalearn-v1', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('sessions', 'readwrite')
        tx.objectStore('sessions').put(session)
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
  }, session)
  await page.reload()
  const focus = page.getByRole('region', { name: 'Fokus latihanmu' })
  await expect(focus).toContainText('2 salah · 1 dibantu dari 3 percobaan')
  await expect(focus).toContainText('Data awal · 0% benar mandiri')
  await expect(focus.getByRole('link', { name: `Detail ${item.glyph}, ${item.answer}` })).toBeVisible()
  const category = focus.getByLabel('Jenis materi')
  await category.selectOption('letter')
  await expect(focus.locator('.focus-list li')).toHaveCount(0)
  await expect(focus).toContainText('Belum ada huruf tunggal yang perlu diulang')
  await category.selectOption('word')
  await expect(focus).toContainText('Belum ada kata yang perlu diulang')
  await category.selectOption('combination')
  await expect(focus.locator('.focus-list li')).toHaveCount(1)
  await expect(focus).toContainText('1 perlu diulang')
  await category.selectOption('all')
  await expect(focus.locator('.focus-list li')).toHaveCount(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(focus.getByRole('link', { name: `Latih ${item.glyph}` })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/progress-focus-mobile.png', fullPage: true })
  await focus.getByRole('link', { name: `Latih ${item.glyph}` }).click()
  await expect(page).toHaveURL(/\/latihan\?/)
  expect(new URL(page.url()).searchParams.get('items')).toBe(item.id)
  await page.goto('/progres')
  await page.getByRole('button', { name: /Korea/ }).click()
  await expect(focus).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Belum ada latihan' })).toBeVisible()
})
