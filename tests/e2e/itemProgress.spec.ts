import { test, expect } from '@playwright/test'
import { content, CONTENT_VERSION } from '../../app/data/content'

test('examples and source fill the left column beneath the letter card', async ({ page }) => {
  const item = content.find(item => item.script === 'hiragana' && item.answer === 'ka' && item.kind === 'letter')!
  await page.goto(`/materi/${encodeURIComponent(item.id)}`)
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as Element & { __vue_app__?: unknown })?.__vue_app__))
  const reference = page.locator('.detail-reference')
  await expect(reference.getByRole('heading', { name: 'Contoh kata' })).toBeVisible()
  await expect(reference.getByRole('link', { name: /Japan Foundation/ })).toBeVisible()
  await expect(reference.locator('.example')).toHaveCount(0)
  await page.getByRole('button', { name: 'Lihat bacaan' }).click()
  await expect(reference.locator('.example')).toHaveCount(3)
  const glyph = await reference.locator('.detail-glyph').boundingBox()
  const examples = await reference.locator('.detail-examples').boundingBox()
  expect(examples!.y).toBeGreaterThan(glyph!.y + glyph!.height)
  expect(examples!.x).toBe(glyph!.x)
  await page.screenshot({ path: 'test-results/item-reference-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(reference.locator('.example').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/item-reference-mobile.png', fullPage: true })
})

test('detail shows an empty state and per-item progress, outcome matrix and recent answers', async ({ page }) => {
  const letters = content.filter(item => item.script === 'hiragana' && item.kind === 'letter')
  const [item, fluent, untouched] = letters
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/materi/${encodeURIComponent(item!.id)}`)
  const panel = page.getByRole('region', { name: 'Progres belajar materi ini' })
  await expect(panel.getByText('Belum dilatih', { exact: true })).toBeVisible()
  await expect(panel.locator('.item-metrics dd')).toHaveText(['—', '0 kali', '0 sesi', '—'])
  await expect(panel.locator('tbody tr')).toHaveCount(4)
  await expect(panel.locator('tfoot')).toContainText('0')

  const sessions = ['typing', 'choice'].map((answerFormat, index) => {
    const outcomes = index ? ['correct', 'correct', 'wrong', 'assisted', 'skipped'] : ['correct', 'correct', 'correct']
    const sessionId = `detail-${index}`
    return {
      id: sessionId, contentVersion: CONTENT_VERSION, device: 'keyboard',
      config: { language: item!.language, script: item!.script, kind: 'letter', group: item!.group, mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [], ...(index ? { answerFormat } : {}) },
      startedAt: `2026-11-0${index + 1}T00:00:00Z`, endedAt: `2026-11-0${index + 1}T00:01:00Z`,
      activeMs: 60000, status: 'completed', hasPaused: false, queue: [item!.id], cursor: 0, unfinished: 0,
      attempts: [...outcomes.map((outcome, order) => ({
        id: `${sessionId}:${order}`, sessionId, itemId: item!.id, input: 'a', outcome,
        accepted: outcome === 'correct' || outcome === 'assisted', assisted: outcome === 'assisted', responseMs: 2000, order
        // Intentionally omit answeredAt to cover older saved progress.
      })), ...Array.from({ length: 5 }, (_, order) => ({
        id: `${sessionId}:fluent:${order}`, sessionId, itemId: fluent!.id, input: fluent!.answer,
        outcome: 'correct', accepted: true, assisted: false, responseMs: 1000, order: order + 5
      }))]
    }
  })
  await page.evaluate(async sessions => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('kanalearn-v1', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('sessions', 'readwrite')
        sessions.forEach(session => tx.objectStore('sessions').put(session))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
    })
  }, sessions)
  await page.reload()
  await expect(panel.getByText('Perlu diulang', { exact: true })).toBeVisible()
  await expect(panel.locator('.item-metrics dd')).toHaveText(['71%', '8 kali', '2 sesi', '2.0 dtk'])
  await expect(panel.locator('tbody tr').nth(0).locator('td')).toHaveText(['3', '2', '5'])
  for (const index of [1, 2, 3]) await expect(panel.locator('tbody tr').nth(index).locator('td')).toHaveText(['0', '1', '1'])
  await expect(panel.locator('tfoot td')).toHaveText(['3', '5', '8'])
  await expect(panel.locator('.recent-attempts li')).toHaveCount(8)
  await expect(panel.locator('progress').first()).toHaveAttribute('value', '7')
  await expect(panel.getByText(/Terakhir berlatih:/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lihat bacaan' })).toBeVisible()
  const practice = new URL(await page.getByRole('link', { name: 'Latih huruf ini' }).getAttribute('href') as string, 'http://localhost')
  expect(practice.searchParams.get('items')).toBe(item!.id)
  await page.screenshot({ path: 'test-results/item-progress-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/item-progress-mobile.png', fullPage: true })

  await page.goto(`/materi/${encodeURIComponent(fluent!.id)}`)
  await expect(panel.getByText('Lancar sementara', { exact: true })).toBeVisible()
  await expect(panel.locator('.item-metrics dd')).toHaveText(['100%', '10 kali', '2 sesi', '1.0 dtk'])
  await expect(panel.locator('.recent-attempts li')).toHaveCount(10)
  await page.goto(`/materi/${encodeURIComponent(untouched!.id)}`)
  await expect(panel.getByText('Belum dilatih', { exact: true })).toBeVisible()
  await expect(panel.locator('.recent-attempts')).toHaveCount(0)
  expect(errors).toEqual([])
})
