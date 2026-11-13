import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test('first visit tour supports interactive learning, language selection, and replay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/belajar')
  const intro = page.getByRole('dialog')
  await expect(intro).toBeVisible()
  await expect(intro.getByRole('heading', { name: 'Huruf baru. Dunia baru.' })).toBeFocused()
  await page.screenshot({ path: 'test-results/intro-desktop.png', fullPage: true })
  await intro.getByRole('button', { name: 'Kenalan dulu, yuk' }).click()
  await expect(intro.getByRole('heading', { name: 'Yang asing, jadi akrab.' })).toBeVisible()
  await intro.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(intro.getByRole('heading', { name: 'Sedikit dulu. Lanjut lagi.' })).toBeVisible()
  await intro.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await intro.getByRole('button', { name: 'i', exact: true }).click()
  await expect(intro.getByText('Hampir!', { exact: false })).toBeVisible()
  await intro.getByRole('button', { name: 'a', exact: true }).click()
  await expect(intro.getByText('✓ Benar!', { exact: false })).toBeVisible()
  await intro.getByRole('button', { name: 'Kembali', exact: true }).click()
  await expect(intro.getByRole('heading', { name: 'Sedikit dulu. Lanjut lagi.' })).toBeVisible()
  await intro.getByRole('button', { name: /^Slide 5:/ }).click()
  await expect(intro.getByRole('heading', { name: 'Santai? Ngebut? Kamu pilih.' })).toBeVisible()
  await intro.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(intro.getByRole('heading', { name: 'Setiap percobaan berarti.' })).toBeVisible()
  await intro.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await intro.getByRole('button', { name: /Korea/ }).click()
  await intro.getByRole('button', { name: 'Mulai petualanganku' }).click()
  await expect(page).toHaveURL(/\/materi\?script=hangul/)
  await expect(intro).not.toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Materi', exact: true })).toBeVisible()
  await expect(intro).not.toBeVisible()
  await page.goto('/pengaturan')
  await page.getByRole('button', { name: 'Putar ulang intro' }).click()
  await expect(intro).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(intro).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Putar ulang intro' })).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  expect(errors).toEqual([])
})

test('mobile intro fits, respects reduced motion, and skip preserves a deep link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/latihan?script=katakana')
  const intro = page.getByRole('dialog')
  await expect(intro).toBeVisible()
  for (let index = 1; index <= 7; index++) {
    await intro.getByRole('button', { name: new RegExp(`^Slide ${index}:`) }).click()
    await expect(intro.getByRole('heading')).toBeVisible()
    await expect.poll(() => intro.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  }
  await page.screenshot({ path: 'test-results/intro-mobile.png', fullPage: true })
  await intro.getByRole('button', { name: 'Lewati intro' }).click()
  await expect(intro).not.toBeVisible()
  await expect(page).toHaveURL(/\/latihan\?script=katakana/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Atur latihan', exact: true })).toBeVisible()
  await expect(intro).not.toBeVisible()
})

test('tour remains dismissible when local storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    const setItem = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'kanalearn-intro-v1') throw new Error('Storage blocked')
      return getItem.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kanalearn-intro-v1') throw new Error('Storage blocked')
      return setItem.call(this, key, value)
    }
  })
  await page.goto('/belajar')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Lewati intro' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mau belajar apa?' })).toBeVisible()
})
