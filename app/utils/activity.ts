import type { Session } from '../types/learning'

export const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export interface ActivityDay {
  date: string
  sessionIds: string[]
  total: number
  correct: number
  wrong: number
  assisted: number
  skipped: number
  responseMs: number
}

export const emptyActivityDay = (date: string): ActivityDay => ({ date, sessionIds: [], total: 0, correct: 0, wrong: 0, assisted: 0, skipped: 0, responseMs: 0 })

// A session counts once on every local day on which it has recorded answers.
// Older backups without answer timestamps fall back to the session start.
export function dailyActivity(sessions: Session[]) {
  const days = new Map<string, ActivityDay>()
  for (const session of sessions) {
    for (const attempt of session.attempts) {
      const timestamp = new Date(attempt.answeredAt ?? session.startedAt)
      if (!Number.isFinite(timestamp.getTime())) continue
      const key = localDateKey(timestamp)
      const day = days.get(key) ?? emptyActivityDay(key)
      if (!day.sessionIds.includes(session.id)) day.sessionIds.push(session.id)
      day.total++
      day[attempt.outcome]++
      day.responseMs += attempt.responseMs
      days.set(key, day)
    }
  }
  return days
}

export const activityLevel = (sessions: number) => sessions === 0 ? 0 : sessions === 1 ? 1 : sessions <= 3 ? 2 : sessions <= 5 ? 3 : 4

export function activityCalendar(year: number) {
  const start = new Date(year, 0, 1, 12)
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  const end = new Date(year, 11, 31, 12)
  end.setDate(end.getDate() + (7 - end.getDay()) % 7)
  const weeks: (string | null)[][] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const week: (string | null)[] = []
    for (let index = 0; index < 7; index++) {
      week.push(cursor.getFullYear() === year ? localDateKey(cursor) : null)
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}
