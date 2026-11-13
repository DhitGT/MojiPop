import { test, expect } from '@playwright/test'
import { content } from '../../app/data/content'

test('full letter table ignores lesson filters and supports scripts, readings, and mobile', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/materi?script=hiragana&group=K')
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as Element & { __vue_app__?: unknown })?.__vue_app__))
  await expect(page.locator('.letter-tile')).toHaveCount(5)
  await page.getByRole('button', { name: 'Tabel semua huruf', exact: true }).click()
  const letters = page.locator('.letter-chart-item')
  const count = (script: string) => content.filter(item => item.script === script && item.kind === 'letter').length
  await expect(letters).toHaveCount(count('hiragana'))
  await expect(page.getByRole('link', { name: 'Latih semua', exact: true })).toHaveAttribute('href', /group=Semua/)
  await page.getByLabel('Sembunyikan bacaan').check()
  await expect(letters.first().locator('.letter-reading')).toHaveText('•••')
  await page.getByLabel('Sembunyikan bacaan').uncheck()
  await expect(letters.first().locator('.letter-reading')).toHaveText('a')
  await page.getByRole('button', { name: 'Per kelompok', exact: true }).click()
  await expect(page.locator('.letter-tile')).toHaveCount(5)
  await page.getByRole('button', { name: 'Tabel semua huruf', exact: true }).click()
  await page.getByRole('button', { name: 'Katakana', exact: true }).click()
  await expect(letters).toHaveCount(count('katakana'))
  await expect(letters.first().locator('.letter-glyph')).toHaveText('ア')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/mobile-letter-table.png', fullPage: true })
  await page.getByRole('button', { name: /Korea/ }).click()
  await expect(letters).toHaveCount(count('hangul'))
  await expect(page.locator('.letter-chart')).toContainText('giyeok')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await letters.first().click()
  await expect(page).toHaveURL(/\/materi\/hangul/)
  expect(errors).toEqual([])
})

test('materials show all groups by default and keep search and group practice scoped', async ({ page }) => {
  await page.goto('/materi?script=hiragana')
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as Element & { __vue_app__?: unknown })?.__vue_app__))
  const hiragana = content.filter(item => item.script === 'hiragana' && item.kind === 'letter')
  const groups = [...new Set(hiragana.map(item => item.group))]
  const sections = page.locator('.material-groups > section')
  await expect(page.locator('.letter-tile')).toHaveCount(hiragana.length)
  await expect(sections).toHaveCount(groups.length)
  for (const [index, group] of groups.entries()) {
    const section = sections.nth(index)
    await expect(section.getByRole('heading')).toContainText(group)
    await expect(section.locator('.letter-tile')).toHaveCount(hiragana.filter(item => item.group === group).length)
    const href = await section.getByRole('link', { name: 'Latih kelompok' }).getAttribute('href')
    const query = new URL(href!, 'http://localhost').searchParams
    expect(query.get('group')).toBe(group)
    expect(query.get('items')?.split(',')).toEqual(hiragana.filter(item => item.group === group).map(item => item.id))
  }
  await page.getByText('Cari & filter', { exact: true }).click()
  await page.getByLabel('Cari', { exact: true }).fill('ka')
  await expect(page.locator('.letter-tile')).toHaveCount(hiragana.filter(item => item.answer.includes('ka')).length)
  await page.getByLabel('Cari', { exact: true }).fill('nothing-matches')
  await expect(page.getByText('Tidak ada materi yang cocok.')).toBeVisible()
  await page.getByLabel('Cari', { exact: true }).fill('')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(sections).toHaveCount(groups.length)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})
