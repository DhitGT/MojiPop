import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attemptMetrics, itemAnalytics, resultHistory, reviewSummary } from '../app/utils/analytics.ts'

const config = { script: 'hiragana', kind: 'letter' }
const attempt = (outcome, ms, extra = {}) => ({ id: crypto.randomUUID(), sessionId: 's', itemId: 'a', order: 0, outcome, responseMs: ms, input: outcome === 'wrong' ? 'i' : 'a', accepted: outcome === 'correct', assisted: outcome === 'assisted', ...extra })
const session = (id, day, attempts, extra = {}) => ({ id, config, contentVersion: '1', startedAt: `2026-11-${day}T00:00:00Z`, attempts, ...extra })

test('focus ranks recent struggles, includes hints and skips, and clears recovered items', () => {
  const answers = (itemId, outcomes) => outcomes.map((outcome, order) => attempt(outcome, 1000, { itemId, order }))
  const rows = reviewSummary([session('s', '01', [
    ...answers('recovered', ['wrong', 'wrong', 'correct', 'correct', 'correct']),
    ...answers('old-error', ['wrong', ...Array(10).fill('correct')]),
    ...answers('struggling', ['wrong', 'wrong', 'correct', 'skipped']),
    ...answers('hint', ['assisted']),
    ...answers('fluent', ['correct'])
  ])])
  assert.deepEqual(rows.map(row => row.itemId), ['hint', 'struggling'])
  assert.equal(rows[0].reason, '1 dibantu')
  assert.equal(rows[0].provisional, true)
  assert.equal(rows[1].reason, '2 salah · 1 dilewati')
  assert.equal(rows[1].accuracy, 25)
  assert.deepEqual(reviewSummary([]), [])
})

test('focus follows answer timestamps when an older session resumes', () => {
  const older = session('older', '01', [attempt('wrong', 1000, { answeredAt: '2026-11-03T00:00:00Z' })])
  const newer = session('newer', '02', Array.from({ length: 3 }, (_, order) => attempt('correct', 1000, { order })))
  assert.equal(reviewSummary([newer, older])[0].wrong, 1)
})

test('metrics include assisted/skipped responses without granting independent accuracy', () => {
  const m = attemptMetrics([attempt('correct', 1000), attempt('wrong', 3000), attempt('assisted', 4000), attempt('skipped', 8000)])
  assert.equal(m.accuracy, 25)
  assert.equal(m.averageMs, 4000)
  assert.equal(m.medianMs, 3500)
  assert.equal(m.fastestMs, 1000)
  assert.equal(m.slowestMs, 8000)
  assert.equal(attemptMetrics([]).averageMs, null)
})

test('matrix accumulates repeated errors, recent accuracy, streaks and actual wrong input', () => {
  const a = session('first', '01', [attempt('wrong', 100), attempt('assisted', 400, { input: 'u', accepted: false }), attempt('correct', 1000)])
  const b = session('second', '02', [attempt('wrong', 100, { sessionId: 'second' }), attempt('wrong', 100, { sessionId: 'second', order: 1 })])
  const [row] = itemAnalytics([b, a])
  assert.equal(row.total, 5)
  assert.equal(row.sessionCount, 2)
  assert.equal(row.currentErrorStreak, 2)
  assert.equal(row.longestErrorStreak, 2)
  assert.equal(row.difficulty, 64)
  assert.equal(row.level, 'Sulit')
  assert.deepEqual(row.commonErrors, [{ input: 'i', count: 3 }, { input: 'u', count: 1 }])
  assert.equal(row.recentAccuracy, 20)
})

test('slow correct answers use personal baseline and low samples stay provisional', () => {
  const [slow, fast] = itemAnalytics([session('s', '01', [attempt('correct', 1000, { itemId: 'fast' }), attempt('correct', 1000, { itemId: 'fast' }), attempt('correct', 6000, { itemId: 'slow' })])])
  assert.equal(slow.itemId, 'slow')
  assert.equal(slow.difficulty, 20)
  assert.ok(slow.signals.some(s => s.includes('1,5')))
  assert.equal(fast.difficulty, 0)
  assert.equal(slow.level, 'Data awal')
})

test('snapshot filters future/resumed answers and separates formats, scripts and versions', () => {
  const old = session('old', '01', [attempt('correct', 1000), attempt('wrong', 1000, { answeredAt: '2026-11-04T00:00:00Z' })])
  const current = session('now', '02', [attempt('correct', 2000)])
  const future = session('future', '03', [attempt('wrong', 1000)])
  const choice = session('choice', '01', [attempt('wrong', 1000)], { config: { ...config, answerFormat: 'choice' } })
  const version = session('version', '01', [attempt('wrong', 1000)], { contentVersion: '2' })
  const script = session('script', '01', [attempt('wrong', 1000)], { config: { ...config, script: 'katakana' } })
  const before = JSON.stringify(old)
  const history = resultHistory(current, [future, choice, current, old, version, script])
  assert.deepEqual(history.map(s => s.id), ['old', 'now'])
  assert.equal(history[0].attempts.length, 1)
  assert.equal(JSON.stringify(old), before)
  assert.deepEqual(itemAnalytics([]), [])
})
