import { test } from 'node:test'
import assert from 'node:assert/strict'
import { achievementProgress, achievementTracks } from '../app/utils/achievements.ts'
import { emptyProgress, validateImport } from '../app/utils/storage.ts'

const content = [{ id: 'a', kind: 'letter' }, { id: 'b', kind: 'word' }]
const day = (date) => new Date(`${date}T12:00:00`).toISOString()
function session(id, date, outcomes, itemId = 'a', status = 'completed') {
  return { id, startedAt: day(date), status, attempts: outcomes.map((outcome, order) => ({
    sessionId: id, itemId, order, outcome, assisted: outcome === 'assisted', answeredAt: day(date), responseMs: 1000,
  })) }
}
const now = new Date('2026-11-13T15:00:00')
const calculate = (sessions, date = now) => achievementProgress(sessions, content, date)

test('read achievement markers survive backup, older backups work, and invalid markers are rejected', () => {
  const progress = emptyProgress()
  progress.settings.achievementSeenIds = ['correct-1', 'sessions-1']
  assert.deepEqual(validateImport(JSON.stringify(progress), new Set()).settings.achievementSeenIds, ['correct-1', 'sessions-1'])
  progress.settings.achievementSeenIds = [42]
  assert.throws(() => validateImport(JSON.stringify(progress), new Set()), /Format progres tidak valid/)
  delete progress.settings.achievementSeenIds
  assert.equal(validateImport(JSON.stringify(progress), new Set()).settings.achievementSeenIds, undefined)
})

test('empty history has many unique, increasing milestones and zero progress', () => {
  const result = calculate([])
  assert.equal(result.unlocked, 0)
  assert.equal(result.currentDailyStreak, 0)
  assert.ok(result.achievements.length >= 80)
  assert.equal(new Set(result.achievements.map(a => a.id)).size, result.achievements.length)
  for (const track of achievementTracks) assert.deepEqual([...track.targets].sort((a,b) => a-b), track.targets)
})

test('only independent correct answers count; empty and unfinished sessions cannot earn completion or perfection', () => {
  const sessions = [session('a', '2026-11-10', ['correct', 'wrong', 'assisted', 'skipped']), session('empty', '2026-11-10', []),
    session('active', '2026-11-11', Array(10).fill('correct'), 'a', 'interrupted'),
    session('perfect', '2026-11-12', Array(10).fill('correct')), session('word', '2026-11-13', ['correct', 'correct'], 'b')]
  const result = calculate(sessions)
  assert.equal(result.metrics.correct, 23)
  assert.equal(result.metrics.sessions, 3)
  assert.equal(result.metrics.perfect, 1)
  assert.equal(result.metrics.explored, 1)
  assert.equal(result.metrics.words, 1)
  assert.equal(result.metrics.answerStreak, 22)
  assert.ok(result.achievements.every(a => a.percent <= 100 && a.value <= a.target))
})

test('mastery needs ten independent attempts and two sessions, and stays earned after errors', () => {
  const first = session('first', '2026-11-10', Array(10).fill('correct'))
  assert.equal(calculate([first]).metrics.mastered, 0)
  const second = session('second', '2026-11-11', ['correct', 'wrong', 'wrong', 'wrong'])
  const snapshot = JSON.stringify([first, second])
  assert.equal(calculate([second, first]).metrics.mastered, 1)
  assert.equal(JSON.stringify([first, second]), snapshot)
  const assisted = session('help', '2026-11-10', Array(10).fill('assisted'))
  assert.equal(calculate([assisted, second]).metrics.mastered, 0)
})

test('local daily streak handles gaps, duplicate sessions, future dates, and midnight across months', () => {
  const sessions = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-01', '2026-11-12', '2026-11-13', '2026-11-14'].map((date, i) => session(String(i), date, ['correct']))
  const result = calculate(sessions)
  assert.equal(result.metrics.days, 5)
  assert.equal(result.metrics.dailyStreak, 3)
  assert.equal(result.currentDailyStreak, 2)
  assert.equal(calculate(sessions.slice(0, -1), new Date('2026-11-14T01:00:00')).currentDailyStreak, 2)
  const later = calculate(sessions, new Date('2026-11-16T01:00:00'))
  assert.equal(later.currentDailyStreak, 0)
  assert.equal(later.metrics.dailyStreak, 3)
})

test('legacy answers use session dates, and streaks follow answer chronology across sessions', () => {
  const older = session('older', '2026-11-11', ['correct', 'correct'])
  older.attempts.forEach(a => delete a.answeredAt)
  const newer = session('newer', '2026-11-12', ['correct', 'assisted', 'correct'])
  assert.equal(calculate([newer, older]).metrics.answerStreak, 3)
  assert.equal(calculate([newer, older]).metrics.dailyStreak, 2)
})
