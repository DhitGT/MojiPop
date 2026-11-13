import { test } from 'node:test'
import assert from 'node:assert/strict'
import { content } from '../app/data/content.ts'
import { makeRace, raceMetrics, insertedRange, ghostPosition, raceConsistency } from '../app/utils/typingRace.ts'

test('race generation preserves whole words and maps source tokens to romaji positions', () => {
  for (const script of ['hiragana', 'katakana', 'hangul']) {
    for (const kind of ['letter', 'word']) {
      const pool = content.filter(item => item.script === script && item.kind === kind)
      const tokens = makeRace(pool, 100, () => .4)
      const target = tokens.map(token => token.answer).join(' ')
      assert.ok(tokens.reduce((sum, token) => sum + [...token.glyph].length, 0) >= 100)
      for (const token of tokens) {
        assert.equal(target.slice(token.start, token.end), token.answer)
        assert.ok(pool.some(item => item.id === token.id && item.prompt === token.glyph))
      }
    }
  }
  assert.deepEqual(makeRace([], 100), [])
})

test('WPM uses five correct characters per word and accuracy retains corrected mistakes', () => {
  assert.deepEqual(raceMetrics('abcde', 'abcde', 30000, 5, 6), { correct: 5, wpm: 2, raw: 2, accuracy: 83 })
  assert.deepEqual(raceMetrics('axcde', 'abcde', 60000, 4, 5), { correct: 4, wpm: 1, raw: 1, accuracy: 80 })
  assert.equal(raceMetrics('', 'abc', 0, 0, 0).wpm, 0)
  assert.deepEqual(insertedRange('abc', 'ab'), [2, 2])
  assert.deepEqual(insertedRange('ac', 'abc'), [1, 2])
  assert.deepEqual(insertedRange('axc', 'abc'), [1, 2])
})

test('ghost replays actual timestamps, backspaces, and holds its final position', () => {
  const frames = [{ at: 0, position: 1 }, { at: 500, position: 2 }, { at: 700, position: 1 }, { at: 900, position: 3 }]
  assert.equal(ghostPosition([], 0), 0)
  assert.equal(ghostPosition(frames, 400), 1)
  assert.equal(ghostPosition(frames, 600), 2)
  assert.equal(ghostPosition(frames, 800), 1)
  assert.equal(ghostPosition(frames, 10000), 3)
})

test('consistency measures typing cadence including idle time and requires enough samples', () => {
  const samples = counts => counts.map((strokes, index) => ({ at: index * 1000, strokes, wpm: 0, raw: 0, accuracy: 100, errors: 0 }))
  assert.equal(raceConsistency(samples([0, 5])), null)
  assert.equal(raceConsistency(samples([0, 5, 10, 15])), 100)
  assert.equal(raceConsistency(samples([0, 0, 0, 0])), 0)
  assert.ok(raceConsistency(samples([0, 10, 10, 15])) < 100)
})
