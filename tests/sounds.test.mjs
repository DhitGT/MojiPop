import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyProgress, validateImport, readSettings } from '../app/utils/storage.ts'

test('sound preferences survive backups and older backups get a default', () => {
  const progress = emptyProgress()
  assert.equal(progress.settings.soundEffects, true)
  progress.settings.soundEffects = false
  assert.equal(validateImport(JSON.stringify(progress), new Set()).settings.soundEffects, false)
  delete progress.settings.soundEffects
  assert.equal(validateImport(JSON.stringify(progress), new Set()).settings.soundEffects, true)
  progress.settings.soundEffects = 'false'
  assert.throws(() => validateImport(JSON.stringify(progress), new Set()), /Format progres tidak valid/)
})

test('sound volume survives backups and old backups use a comfortable default', () => {
  const progress = emptyProgress()
  assert.equal(progress.settings.soundVolume, 65)
  for (const volume of [0, 35, 100]) {
    progress.settings.soundVolume = volume
    assert.equal(validateImport(JSON.stringify(progress), new Set()).settings.soundVolume, volume)
  }
  delete progress.settings.soundVolume
  assert.equal(validateImport(JSON.stringify(progress), new Set()).settings.soundVolume, 65)
  for (const volume of [-1, 101, '50', null]) {
    progress.settings.soundVolume = volume
    assert.throws(() => validateImport(JSON.stringify(progress), new Set()), /Format progres tidak valid/)
  }
})

test('stored volume restores zero and falls back for invalid values', () => {
  const original = globalThis.localStorage
  try {
    for (const [volume, expected] of [[0, 0], [40, 40], [undefined, 65], [null, 65], [-5, 65], [Infinity, 65], ['50', 65]]) {
      globalThis.localStorage = { getItem: () => JSON.stringify({ language: 'ja', reducedMotion: false, soundVolume: volume }) }
      assert.equal(readSettings().soundVolume, expected)
    }
  } finally {
    if (original === undefined) delete globalThis.localStorage
    else globalThis.localStorage = original
  }
})
