import { expect, test } from '@playwright/test'

test('public pages expose SEO metadata and content in server HTML', async ({ request }) => {
  for (const [path, title, content] of [
    ['/', 'Belajar Hiragana, Katakana &amp; Hangul', 'Dari asing,'],
    ['/materi', 'Materi Hiragana, Katakana &amp; Hangul', 'Hiragana'],
    ['/materi/hiragana%3A%E3%81%82', 'あ (a)', 'Latih huruf ini'],
    ['/latihan', 'Latihan Huruf Jepang &amp; Korea', 'Sprint 60 detik'],
  ]) {
    const response = await request.get(path!)
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toContain(title)
    expect(html).toContain(content)
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('rel="canonical"')
    expect(html.match(/<title>/g)).toHaveLength(1)
  }
})

test('private pages are noindex even before browser storage loads', async ({ request }) => {
  for (const path of ['/arena?id=private-session', '/hasil/private-session', '/progres', '/pengaturan', '/latihan?retry=private-session']) {
    const html = await (await request.get(path)).text()
    expect(html).toContain('name="robots" content="noindex, follow"')
    expect(html.match(/<link[^>]+rel="canonical"[^>]*>/)?.[0]).not.toContain('?')
  }
})

test('crawler routes and brand assets are available', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('/sitemap.xml')
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('/materi/hiragana%3A')
  for (const path of ['/arena', '/hasil', '/progres', '/pengaturan']) expect(sitemap).not.toContain(path)
  for (const path of ['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/site.webmanifest', '/images/og-kanalearn.png']) {
    expect((await request.get(path)).ok()).toBeTruthy()
  }
})

test('metadata follows client navigation without hydration errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle(/Belajar Hiragana/)
  await page.getByRole('link', { name: 'Buka aplikasi' }).click()
  await expect(page).toHaveURL(/\/belajar$/)
  await page.locator('nav').getByRole('link', { name: 'Materi', exact: true }).click()
  await expect(page).toHaveTitle(/Materi Hiragana/)
  await page.locator('nav').getByRole('link', { name: 'Progres', exact: true }).click()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await page.locator('nav').getByRole('link', { name: 'Beranda', exact: true }).click()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await page.getByRole('link', { name: 'KanaLearn beranda' }).click()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
  expect(errors).toEqual([])
})
