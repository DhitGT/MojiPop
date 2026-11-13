import type { Attempt, Session } from '../types/learning'

export const meanResponse = (attempts: Attempt[]) => attempts.length ? attempts.reduce((sum, a) => sum + a.responseMs, 0) / attempts.length : null

/** A result is a snapshot: later answers must not change an older report. */
export function resultHistory(current: Session, sessions: Session[]) {
  const cutoff = current.attempts.reduce((latest, a) => Math.max(latest, Date.parse(a.answeredAt || current.startedAt)), Date.parse(current.endedAt || current.startedAt))
  return sessions.filter(s => s.config.script === current.config.script && s.config.kind === current.config.kind
    && (s.config.answerFormat || 'typing') === (current.config.answerFormat || 'typing') && s.contentVersion === current.contentVersion)
    .map(s => ({ ...s, attempts: s.id === current.id ? s.attempts : s.attempts.filter(a => Date.parse(a.answeredAt || s.startedAt) <= cutoff) }))
    .filter(s => s.attempts.length).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt) || a.id.localeCompare(b.id))
}

export function attemptMetrics(attempts: Attempt[]) {
  const total = attempts.length
  const correct = attempts.filter(a => a.outcome === 'correct').length
  const wrong = attempts.filter(a => a.outcome === 'wrong').length
  const assisted = attempts.filter(a => a.outcome === 'assisted').length
  const skipped = attempts.filter(a => a.outcome === 'skipped').length
  const times = attempts.map(a => a.responseMs).sort((a, b) => a - b)
  const middle = Math.floor(total / 2)
  return { total, correct, wrong, assisted, skipped, accuracy: total ? correct / total * 100 : 0,
    averageMs: meanResponse(attempts), medianMs: total ? total % 2 ? times[middle]! : (times[middle - 1]! + times[middle]!) / 2 : null,
    fastestMs: times[0] ?? null, slowestMs: times.at(-1) ?? null }
}

export function itemAnalytics(sessions: Session[]) {
  const entries = sessions.flatMap(s => s.attempts.map(a => ({ attempt: a, start: s.startedAt })))
    .sort((a, b) => Date.parse(a.attempt.answeredAt || a.start) - Date.parse(b.attempt.answeredAt || b.start) || a.attempt.order - b.attempt.order)
  const baselineMs = meanResponse(entries.map(e => e.attempt).filter(a => a.outcome === 'correct'))
  const grouped = new Map<string, Attempt[]>()
  for (const { attempt } of entries) {
    if (!grouped.has(attempt.itemId)) grouped.set(attempt.itemId, [])
    grouped.get(attempt.itemId)!.push(attempt)
  }
  return [...grouped].map(([itemId, attempts]) => {
    const metrics = attemptMetrics(attempts)
    const correctMs = meanResponse(attempts.filter(a => a.outcome === 'correct'))
    // Speed only uses independently correct answers; fast guesses cannot reduce error difficulty.
    const slowRatio = correctMs !== null && baselineMs !== null && baselineMs > 0 ? Math.min(1, Math.max(0, correctMs / baselineMs - 1)) : 0
    const difficulty = Math.round(80 * (1 - metrics.accuracy / 100) + 20 * slowRatio)
    let errorStreak = 0, longestErrorStreak = 0, currentErrorStreak = 0
    for (const a of attempts) {
      errorStreak = a.outcome === 'wrong' ? errorStreak + 1 : 0
      longestErrorStreak = Math.max(longestErrorStreak, errorStreak)
    }
    currentErrorStreak = errorStreak
    const wrongInputs = new Map<string, number>()
    for (const a of attempts.filter(a => a.outcome === 'wrong' || (a.outcome === 'assisted' && !a.accepted))) {
      wrongInputs.set(a.input, (wrongInputs.get(a.input) || 0) + 1)
    }
    const commonErrors = [...wrongInputs].map(([input, count]) => ({ input, count })).sort((a, b) => b.count - a.count)
    const signals: string[] = []
    if (currentErrorStreak >= 2) signals.push(`${currentErrorStreak} jawaban terakhir salah berturut-turut`)
    else if (metrics.wrong >= 2) signals.push(`Salah berulang (${metrics.wrong} kali)`)
    if (metrics.assisted) signals.push(`Memakai petunjuk ${metrics.assisted} kali`)
    if (metrics.skipped) signals.push(`Dilewati ${metrics.skipped} kali`)
    if (slowRatio >= .5) signals.push('Respons benar ≥1,5× rata-rata pribadi')
    if (!signals.length) signals.push(metrics.wrong ? 'Bacaan belum konsisten' : 'Belum terlihat pola kesulitan')
    return { itemId, attempts, ...metrics, correctMs, difficulty, longestErrorStreak, currentErrorStreak, commonErrors, signals,
      recentAccuracy: attemptMetrics(attempts.slice(-10)).accuracy, sessionCount: new Set(attempts.map(a => a.sessionId)).size,
      level: attempts.length < 5 ? 'Data awal' : difficulty >= 60 ? 'Sulit' : difficulty >= 30 ? 'Perlu latihan' : 'Relatif lancar' }
  }).sort((a, b) => b.difficulty - a.difficulty || b.wrong - a.wrong || a.itemId.localeCompare(b.itemId))
}
