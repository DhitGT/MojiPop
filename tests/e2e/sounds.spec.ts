import { test, expect } from '@playwright/test'

test('answer feedback and completion play distinct sounds, and mute survives reload', async ({ page }) => {
  await page.addInitScript(() => {
    const recorded: number[] = []
    Object.assign(window, { soundNotes: recorded })
    const start = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (when?: number) {
      recorded.push(this.frequency.value)
      start.call(this, when)
    }
  })
  // Achievement chimes have their own channel; this test checks answer/session melodies.
  const notes = () => page.evaluate(() => (window as unknown as { soundNotes: number[] }).soundNotes.filter(note => ![880, 1109, 1319, 1760].includes(note)))
  await page.clock.install()
  await page.goto('/latihan?script=hiragana&kind=letter&format=choice&items=hiragana%3A%E3%81%82')
  await page.getByRole('button', { name: 'Mulai latihan', exact: true }).click()
  const options = page.locator('.romaji-option')
  await expect(options.first()).toBeEnabled()
  const correct = options.filter({ has: page.locator('strong', { hasText: /^a$/ }) })
  await correct.click()
  await expect.poll(notes).toEqual([659, 988])
  await page.clock.runFor(1000)
  await expect(options.first()).toBeEnabled()
  await options.filter({ hasNot: page.locator('strong', { hasText: /^a$/ }) }).first().click()
  await expect.poll(notes).toEqual([659, 988, 233, 175])
  await page.clock.fastForward(61000)
  await expect(page).toHaveURL(/\/hasil\//)
  await expect.poll(notes).toEqual([659, 988, 233, 175, 523, 659, 784, 1047, 784, 659])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sesi selesai', exact: true })).toBeVisible()
  expect(await notes()).toEqual([])

  await page.goto('/pengaturan')
  await page.getByRole('checkbox', { name: /Efek suara/ }).uncheck()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /Efek suara/ })).not.toBeChecked()
  await page.goto('/latihan?script=hiragana&kind=letter&format=choice&items=hiragana%3A%E3%81%82')
  await page.getByRole('button', { name: 'Mulai latihan', exact: true }).click()
  await expect(options.first()).toBeEnabled()
  await correct.click()
  await expect(page.locator('.feedback')).toContainText('Benar')
  await page.clock.fastForward(61000)
  await expect(page).toHaveURL(/\/hasil\//)
  expect(await notes()).toEqual([])
})

test('volume and every preview work, persist, and respect silent settings', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { soundNotes: [] as number[] })
    const start = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (when?: number) {
      (window as unknown as { soundNotes: number[] }).soundNotes.push(this.frequency.value)
      start.call(this, when)
    }
  })
  await page.goto('/pengaturan')
  const volume = page.getByRole('slider', { name: 'Volume efek suara' })
  await expect(volume).toHaveValue('65')
  await volume.fill('35')
  await expect(page.locator('output[for="sound-volume"]')).toHaveText('35%')
  await page.reload()
  await expect(volume).toHaveValue('35')
  for (const [effect, expected] of [
    ['correct', [659, 988]], ['wrong', [233, 175]], ['hint', [523, 659]],
    ['skip', [440, 330]], ['complete', [523, 659, 784, 1047, 784, 659]],
    ['achievement', [880, 1109, 1319, 1760]], ['type', [740]], ['typo', [185]]
  ] as const) {
    await page.getByLabel('Coba efek suara', { exact: true }).selectOption(effect)
    await page.evaluate(() => { (window as unknown as { soundNotes: number[] }).soundNotes = [] })
    await page.getByRole('button', { name: 'Putar suara' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { soundNotes: number[] }).soundNotes)).toEqual([...expected])
  }
  await volume.fill('0')
  await expect(page.getByRole('button', { name: 'Putar suara' })).toBeDisabled()
  await page.reload()
  await expect(volume).toHaveValue('0')
  await page.getByRole('checkbox', { name: /Efek suara/ }).uncheck()
  await expect(volume).toBeDisabled()
  await expect(page.getByLabel('Coba efek suara', { exact: true })).toBeDisabled()
})

test('typing race plays gentle keystrokes, typo feedback, and timer completion', async ({ page }) => {
  await page.addInitScript(() => {
    const recorded: number[] = []
    Object.assign(window, { soundNotes: recorded })
    const start = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (when?: number) {
      recorded.push(this.frequency.value)
      start.call(this, when)
    }
  })
  const notes = () => page.evaluate(() => (window as unknown as { soundNotes: number[] }).soundNotes)
  await page.clock.install()
  await page.goto('/typing-race')
  await page.getByLabel('Durasi', { exact: true }).selectOption('15')
  await page.getByLabel('Tampilkan petunjuk romaji').check()
  const first = (await page.locator('.race-track .pending').first().textContent())!
  const input = page.getByRole('textbox', { name: 'Ketik romaji di sini' })
  await input.pressSequentially(first)
  await expect.poll(notes).toEqual([740])
  await page.clock.runFor(100)
  await input.pressSequentially('!')
  await expect.poll(notes).toEqual([740, 185])
  await page.clock.runFor(100)
  await input.press('Backspace')
  expect(await notes()).toEqual([740, 185])
  await page.clock.runFor(15000)
  await expect(page.getByRole('heading', { name: 'Race selesai!' })).toBeVisible()
  await expect.poll(notes).toEqual([740, 185, 523, 659, 784, 1047, 784, 659])
})

test('muting cancels pending audio even when it is enabled again before resume', async ({ page }) => {
  await page.addInitScript(() => {
    const pending: (() => void)[] = []
    const notes: number[] = []
    Object.assign(window, { soundNotes: notes, resumeSound: () => pending.splice(0).forEach(resolve => resolve()) })
    class AudioEngine {
      state = 'suspended'
      currentTime = 0
      destination = {}
      resume() { return new Promise<void>(resolve => pending.push(() => { this.state = 'running'; resolve() })) }
      createGain() {
        const parameter = { value: 0, cancelAndHoldAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }
        return { gain: parameter, connect() {}, disconnect() {} }
      }
      createOscillator() {
        const frequency = { value: 0 }
        return { frequency, type: 'sine', connect() {}, disconnect() {}, start() { notes.push(frequency.value) }, stop() {}, onended: null }
      }
    }
    Object.assign(window, { AudioContext: AudioEngine })
  })
  await page.clock.install()
  await page.goto('/pengaturan')
  await page.getByRole('button', { name: 'Putar suara' }).click()
  const toggle = page.getByRole('checkbox', { name: /Efek suara/ })
  await toggle.uncheck()
  await toggle.check()
  await page.evaluate(() => (window as unknown as { resumeSound: () => void }).resumeSound())
  // Only the fresh enable confirmation plays; the old preview is discarded.
  await expect.poll(() => page.evaluate(() => (window as unknown as { soundNotes: number[] }).soundNotes)).toEqual([659, 988])
})
