import { test, expect } from '@playwright/test'

test('hero cycles through every mascot and sidebar friends animate and respond to greetings', async ({ page }) => {
  await page.clock.install()
  await page.goto('/belajar')
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as Element & { __vue_app__?: unknown })?.__vue_app__))
  const hero = page.locator('.quest-mascot .kiko-mascot')
  await expect(page.locator('.companion-next')).toBeInViewport()
  await page.locator('.sidebar-companion').getByRole('button', { name: 'Tampilkan maskot berikutnya' }).click()
  await expect(page.locator('.sidebar-companion .kiko-mascot')).toHaveAttribute('data-character', 'mimi')
  await expect(hero).toHaveAttribute('data-motion', 'running')
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  const seen = new Set<string>()
  for (let i = 0; i < 4; i++) {
    const character = (await hero.getAttribute('data-character'))!
    seen.add(character)
    await expect(page.locator('.quest-mascot .mascot-name')).toHaveText(character.toUpperCase())
    await expect(hero.locator('.mascot-frame-open')).toHaveAttribute('src', `/images/${character}-mascot.png`)
    await expect(hero.locator('.mascot-frame-closed')).toHaveAttribute('src', `/images/${character}-blink.png`)
    await page.clock.fastForward(8000)
  }
  expect([...seen].sort()).toEqual(['kiko', 'kuro', 'mimi', 'momo'])
  const sidebar = page.locator('.sidebar-companion')
  const animations = new Set<string>()
  for (let i = 0; i < 4; i++) {
    const mascot = sidebar.getByRole('button', { name: /^Sapa / })
    await expect(mascot).toHaveAttribute('data-motion', 'running')
    animations.add(await mascot.locator('.kiko-idle').evaluate(el => getComputedStyle(el).animationName))
    const previousLine = await sidebar.locator('.companion-dialogue').innerText()
    await mascot.click()
    await expect(mascot).toHaveAttribute('data-reaction', 'jump')
    await expect(sidebar.locator('.companion-dialogue')).not.toHaveText(previousLine)
    await mascot.press('Enter')
    await expect(mascot).toHaveAttribute('data-reaction', 'jump')
    await sidebar.getByRole('button', { name: 'Tampilkan maskot berikutnya' }).click()
  }
  expect(animations.size).toBe(4)
  expect(animations.has('none')).toBe(false)
})

test('all sidebar mascots blink with real eye frames and stop for reduced motion', async ({ page }) => {
  await page.goto('/belajar')
  const sidebar = page.locator('.sidebar-companion')
  await sidebar.hover()
  for (let i = 0; i < 4; i++) {
    const mascot = sidebar.locator('.kiko-mascot')
    await expect(mascot).toHaveAttribute('data-motion', 'running')
    await expect.poll(() => mascot.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
    await mascot.evaluate(element => {
      for (const frame of element.querySelectorAll('img')) {
        const animation = frame.getAnimations()[0]!
        animation.pause()
        animation.currentTime = Number(animation.effect!.getTiming().duration) * .46
      }
    })
    await expect(mascot.locator('.mascot-frame-closed')).toHaveCSS('opacity', '1')
    await expect(mascot.locator('.mascot-frame-open')).toHaveCSS('opacity', '0')
    await sidebar.getByRole('button', { name: 'Tampilkan maskot berikutnya' }).click()
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(sidebar.locator('.kiko-mascot')).toHaveAttribute('data-motion', 'paused')
  await expect(sidebar.locator('.mascot-frame-open')).toHaveCSS('opacity', '1')
  await expect(sidebar.locator('.mascot-frame-closed')).toHaveCSS('opacity', '0')
})

test('typing mascot responds to touch and keyboard, including with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/typing-race')
  const mascot = page.locator('.typing-mascot')
  await mascot.click()
  await expect(mascot).toHaveAttribute('data-expression', 'laughing')
  await mascot.press('Enter')
  await expect(mascot).toHaveAttribute('data-expression', 'laughing')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(mascot).toHaveAttribute('data-motion', 'paused')
  await mascot.click()
  await expect(mascot).toHaveAttribute('data-expression', 'laughing')
  await expect(mascot.locator('.head-pose')).toHaveCSS('animation-name', 'none')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('arena and result mascots can be greeted without advancing the question', async ({ page }) => {
  await page.goto('/latihan?script=hiragana&kind=letter&items=hiragana%3A%E3%81%82')
  await page.getByRole('button', { name: 'Mulai latihan', exact: true }).click()
  await expect(page.locator('#answer')).toBeEditable()
  await page.locator('#answer').fill('x')
  await page.locator('#answer').press('Enter')
  await expect(page.getByText('Belum tepat', { exact: true })).toBeVisible()
  const mascot = page.locator('.arena-companion').getByRole('button', { name: /^Sapa / })
  await mascot.press('Enter')
  await expect(mascot).toHaveAttribute('data-reaction', 'jump')
  await expect(page.getByText('Belum tepat', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Jeda', exact: true }).click()
  await page.getByRole('button', { name: 'Akhiri sesi', exact: true }).click()
  const result = page.locator('.results-hero').getByRole('button', { name: 'Sapa Mimi' })
  await result.click()
  await expect(result).toHaveAttribute('data-reaction', 'jump')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(result).toHaveAttribute('data-motion', 'paused')
  await expect(result.locator('.kiko-idle')).toHaveCSS('animation-name', 'none')
})
