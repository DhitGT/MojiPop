import { test } from 'node:test'
import assert from 'node:assert/strict'
import { learningReport } from '../app/utils/report.ts'

const now = new Date(2026, 10, 13, 12)
const stamp = day => new Date(2026, 10, day, 10).toISOString()
const session = (id, day, outcomes, extra = {}) => ({
  id, config: { language: 'ja', script: 'hiragana', kind: 'letter' }, status: 'completed', startedAt: stamp(day),
  attempts: outcomes.map((outcome, order) => ({ itemId: `item-${order % 2}`, outcome, responseMs: 1000, order })), ...extra
})

test('report filters by answer date, includes the full first local day and isolates languages', () => {
  const resumed = session('resumed', 1, ['wrong', 'correct'])
  resumed.attempts[1].answeredAt = stamp(13)
  const sessions = [resumed, session('boundary', 7, ['correct']), session('old', 6, ['wrong']),
    session('future', 14, ['correct']), session('korean', 13, ['wrong'], { config: { language: 'ko', script: 'hangul', kind: 'letter' } })]
  const report = learningReport(sessions, 'ja', '7', now)
  assert.equal(report.total, 2)
  assert.equal(report.accuracy, 100)
  assert.equal(report.activeDays, 2)
  assert.equal(report.responseMs, 2000)
  assert.equal(report.completed, 2)
  assert.equal(resumed.attempts.length, 2)
  assert.equal(learningReport(sessions, 'ja', 'all', now).total, 4)
  assert.equal(learningReport(sessions, 'ko', '7', now).total, 1)
})

test('accuracy is weighted by answers; help and skips cannot raise the grade', () => {
  const report = learningReport([session('small', 12, ['correct']),
    session('large', 13, [...Array(16).fill('correct'), 'wrong', 'assisted', 'skipped'])], 'ja', '30', now)
  assert.equal(report.total, 20)
  assert.equal(report.accuracy, 85)
  assert.equal(report.grade, 'B')
  assert.equal(report.rows[0].accuracy, 85)
  assert.equal(report.items, 2)
  assert.equal(report.wrong, 1)
  assert.equal(report.assisted, 1)
  assert.equal(report.skipped, 1)
})

test('small samples have no grade; empty reports have no invented accuracy', () => {
  const empty = learningReport([], 'ja', '30', now)
  assert.equal(empty.accuracy, null)
  assert.equal(empty.grade, null)
  assert.deepEqual(empty.rows, [])
  assert.equal(learningReport([session('tiny', 13, ['correct'])], 'ja', '30', now).grade, null)
  for (const [correct, grade] of [[18, 'A'], [16, 'B'], [13, 'C'], [12, 'D']]) {
    const result = learningReport([session('graded', 13, [...Array(correct).fill('correct'), ...Array(20 - correct).fill('wrong')])], 'ja', '30', now)
    assert.equal(result.grade, grade)
  }
})

test('report separates scripts and kinds and includes unfinished answers without counting a completion', () => {
  const report = learningReport([session('letters', 13, ['correct']), session('words', 13, ['wrong'], {
    config: { language: 'ja', script: 'hiragana', kind: 'word' }, status: 'interrupted'
  }), session('katakana', 13, ['assisted'], { config: { language: 'ja', script: 'katakana', kind: 'letter' } })], 'ja', '30', now)
  assert.equal(report.rows.length, 3)
  assert.equal(report.completed, 2)
  assert.equal(report.total, 3)
})
