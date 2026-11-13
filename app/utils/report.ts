import type { Language, Session } from '../types/learning'

export type ReportPeriod = '7' | '30' | 'all'

/** Filter answers, not session starts: resumed sessions may span multiple periods. */
export function learningReport(sessions: Session[], language: Language, period: ReportPeriod, now = new Date()) {
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (period !== 'all') start.setDate(start.getDate() - (Number(period) - 1))
  const selected = sessions.filter(session => session.config.language === language).flatMap(session => {
    const attempts = session.attempts.filter(attempt => {
      const time = Date.parse(attempt.answeredAt || session.startedAt)
      return time < end.getTime() && (period === 'all' || time >= start.getTime())
    })
    return attempts.length ? [{ ...session, attempts }] : []
  })
  const attempts = selected.flatMap(session => session.attempts)
  const correct = attempts.filter(attempt => attempt.outcome === 'correct').length
  const accuracy = attempts.length ? correct / attempts.length * 100 : null
  const activeDays = new Set(selected.flatMap(session => session.attempts.map(attempt => new Date(attempt.answeredAt || session.startedAt).toDateString()))).size
  const rows = [...new Set(selected.map(session => `${session.config.script}:${session.config.kind}`))].map(key => {
    const peers = selected.filter(session => `${session.config.script}:${session.config.kind}` === key)
    const answers = peers.flatMap(session => session.attempts)
    const right = answers.filter(attempt => attempt.outcome === 'correct').length
    return { key, script: peers[0]!.config.script, kind: peers[0]!.config.kind, total: answers.length, correct: right,
      accuracy: right / answers.length * 100, items: new Set(answers.map(attempt => attempt.itemId)).size }
  }).sort((a, b) => a.key.localeCompare(b.key))
  const grade = accuracy === null || attempts.length < 20 ? null : accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 65 ? 'C' : 'D'
  return { sessions: selected, attempts, total: attempts.length, correct, accuracy, grade, activeDays, rows,
    completed: selected.filter(session => session.status === 'completed').length,
    responseMs: attempts.reduce((sum, attempt) => sum + attempt.responseMs, 0),
    items: new Set(attempts.map(attempt => attempt.itemId)).size,
    wrong: attempts.filter(attempt => attempt.outcome === 'wrong').length,
    assisted: attempts.filter(attempt => attempt.outcome === 'assisted').length,
    skipped: attempts.filter(attempt => attempt.outcome === 'skipped').length }
}
