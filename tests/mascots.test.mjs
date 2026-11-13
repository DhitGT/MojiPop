import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mascots, mascotIds, pickMascot, typingMood } from '../app/data/mascots.ts'

test('all four mascots are equally reachable and have distinct personalities and error reactions', () => {
  assert.deepEqual([0, .25, .5, .75].map(value => pickMascot(() => value)), mascotIds)
  assert.equal(new Set(mascotIds.map(id => mascots[id].personality)).size, 4)
  assert.deepEqual(mascotIds.map(id => typingMood(id, 1, 0, true)), ['angry', 'oops', 'sideeye', 'unbothered'])
  assert.equal(new Set(mascotIds.map(id => mascots[id].lines.idle)).size, 4)
  for (const profile of Object.values(mascots)) {
    assert.ok(profile.focusAt < profile.overwhelmedAt)
    assert.ok(profile.lines[profile.mistakeMood])
    assert.equal(profile.eyes.length, 2)
  }
})

test('personalities have different pacing, focus thresholds, and celebration milestones', () => {
  assert.equal(typingMood('kiko', 12, 0, false), 'focused')
  assert.equal(typingMood('mimi', 12, 0, false), 'typing')
  assert.equal(typingMood('kiko', 22, 0, false), 'overwhelmed')
  assert.equal(typingMood('momo', 22, 0, false), 'focused')
  assert.equal(typingMood('momo', 36, 0, false), 'overwhelmed')
  for (const id of mascotIds) {
    assert.equal(typingMood(id, 1, mascots[id].laughEvery, false), 'laughing')
    assert.equal(typingMood(id, mascots[id].overwhelmedAt, 0, true), 'overwhelmed')
  }
  assert.ok(mascots.momo.sleepAfter < mascots.kuro.sleepAfter)
  assert.ok(mascots.mimi.tapDuration > mascots.kiko.tapDuration)
})
