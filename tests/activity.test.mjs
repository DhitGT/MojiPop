import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activityCalendar, activityLevel, dailyActivity, localDateKey } from '../app/utils/activity.ts'

const timestamp = (year, month, day, hour = 12) => new Date(year, month - 1, day, hour).toISOString()
const attempt = (outcome, answeredAt, responseMs = 1000) => ({ outcome, answeredAt, responseMs })

test('activity counts unique sessions per local answer day, including resumed sessions', () => {
  const startedAt = timestamp(2026, 11, 12, 23)
  const days = dailyActivity([
    { id: 'resumed', startedAt, attempts: [attempt('correct', startedAt), attempt('wrong', timestamp(2026, 11, 13, 0)), attempt('assisted', timestamp(2026, 11, 13, 1))] },
    { id: 'second', startedAt: timestamp(2026, 11, 13), attempts: [attempt('skipped', timestamp(2026, 11, 13))] },
    { id: 'empty', startedAt, attempts: [] }
  ])
  assert.equal(days.get('2026-11-12').total, 1)
  assert.deepEqual(days.get('2026-11-13'), { date: '2026-11-13', sessionIds: ['resumed', 'second'], total: 3, correct: 0, wrong: 1, assisted: 1, skipped: 1, responseMs: 3000 })
})

test('older answers fall back to session start without changing the stored data', () => {
  const sessions = [{ id: 'old', startedAt: timestamp(2024, 2, 29), attempts: [attempt('correct', undefined), attempt('wrong', 'invalid')] }]
  const before = JSON.stringify(sessions)
  const days = dailyActivity(sessions)
  assert.equal(days.size, 1)
  assert.equal(days.get('2024-02-29').correct, 1)
  assert.equal(JSON.stringify(sessions), before)
  assert.equal(dailyActivity([]).size, 0)
})

test('calendar covers every day once, aligned Monday through Sunday, including leap years', () => {
  for (const year of [2024, 2026, 2028]) {
    const weeks = activityCalendar(year)
    const keys = weeks.flat().filter(Boolean)
    assert.equal(keys.length, year === 2026 ? 365 : 366)
    assert.equal(new Set(keys).size, keys.length)
    assert.equal(keys[0], `${year}-01-01`)
    assert.equal(keys.at(-1), `${year}-12-31`)
    for (const week of weeks) {
      assert.equal(week.length, 7)
      week.forEach((key, index) => {
        if (key) assert.equal((new Date(`${key}T12:00:00`).getDay() + 6) % 7, index)
      })
    }
  }
  assert.equal(localDateKey(new Date(2026, 0, 2, 0)), '2026-01-02')
})

test('color intensity increases at stable session thresholds', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 100].map(activityLevel), [0, 1, 2, 2, 3, 3, 4, 4])
})
