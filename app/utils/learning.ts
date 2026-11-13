import type { Attempt, ConfusionGroup, ContentItem, PracticeConfig, Session } from '../types/learning'

export const normalizeAnswer = (answer: string) => answer.trim().toLowerCase().normalize('NFC')
export function accepts(item: ContentItem, input: string) {
  return [item.answer, ...item.aliases].includes(normalizeAnswer(input))
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

export function selectPool(config: PracticeConfig, content: ContentItem[]) {
  const matching = content.filter(item => item.language === config.language && item.script === config.script && item.kind === config.kind)
  if (config.itemIds.length) return matching.filter(item => config.itemIds.includes(item.id))
  if (config.group === 'Semua') return matching
  if (config.kind === 'word' && !matching.some(item => item.group === config.group)) {
    const known = new Set(content.filter(item => item.script === config.script && item.kind === 'letter' && item.group === config.group).map(item => item.id))
    return matching.filter(item => item.prerequisites.length > 0 && item.prerequisites.every(id => known.has(id)))
  }
  return matching.filter(item => item.group === config.group)
}

export function makeQueue(pool: ContentItem[], count: number, reviewIds: string[] = [], benchmark = false): string[] {
  if (!pool.length) return []
  const total = count || 30
  const ids = pool.map(item => item.id).sort()
  let result: string[] = []
  if (benchmark) {
    // Same pool and count always produce the same composition; only order changes.
    result = Array.from({ length: total }, (_, index) => ids[index % ids.length]!)
    result = shuffle(result)
  } else {
    const review = ids.filter(id => reviewIds.includes(id))
    const other = ids.filter(id => !reviewIds.includes(id))
    for (let index = 0; index < total; index++) {
      const bucket = review.length && (index % 10 < 7 || !other.length) ? review : other.length ? other : ids
      const recent = result.slice(-Math.min(2, Math.max(1, bucket.length - 1)))
      const options = bucket.filter(id => !recent.includes(id))
      const alternatives = ids.filter(id => id !== result.at(-1))
      result.push(shuffle(options.length ? options : alternatives.length ? alternatives : bucket)[0]!)
    }
  }
  for (let index = 1; index < result.length; index++) {
    if (result[index] !== result[index - 1]) continue
    const next = result.findIndex((id, pos) => pos > index && id !== result[index - 1])
    if (next !== -1) [result[index], result[next]] = [result[next]!, result[index]!]
  }
  return result
}

export function makeAttempt(session: Session, item: ContentItem, input: string, assisted: boolean, skipped: boolean, responseMs: number): Attempt {
  const accepted = !skipped && accepts(item, input)
  return {
    id: `${session.id}:${session.attempts.length}`, sessionId: session.id, itemId: item.id,
    input: normalizeAnswer(input), accepted, assisted, responseMs: Math.max(0, responseMs),
    outcome: skipped ? 'skipped' : assisted ? 'assisted' : accepted ? 'correct' : 'wrong', order: session.attempts.length,
    answeredAt: new Date().toISOString()
  }
}

export function summarize(session: Session) {
  const counts = { correct: 0, wrong: 0, assisted: 0, skipped: 0 }
  session.attempts.forEach(attempt => counts[attempt.outcome]++)
  const times = session.attempts.filter(attempt => attempt.outcome === 'correct').map(attempt => attempt.responseMs).sort((a, b) => a - b)
  const mid = Math.floor(times.length / 2)
  return {
    ...counts, total: session.attempts.length,
    accuracy: session.attempts.length ? counts.correct / session.attempts.length * 100 : 0,
    medianMs: times.length ? times.length % 2 ? times[mid]! : (times[mid - 1]! + times[mid]!) / 2 : null,
    recordEligible: session.status === 'completed' && !session.hasPaused && session.attempts.length > 0 && counts.correct / session.attempts.length >= 0.9 && session.config.mode !== 'relaxed'
      && (session.config.mode === 'sprint' ? session.activeMs >= 60000 : session.attempts.length === session.config.count)
  }
}

export function chronologicalAttempts(sessions: Session[], itemId?: string): Attempt[] {
  // Legacy backups have no per-answer time; preserve their known session/order chronology.
  return sessions.flatMap((session, sessionIndex) => session.attempts.filter(attempt => !itemId || attempt.itemId === itemId).map(attempt => ({
    attempt, sessionIndex, time: Date.parse(attempt.answeredAt || session.startedAt), start: Date.parse(session.startedAt)
  }))).sort((a, b) => a.time - b.time || a.start - b.start || a.sessionIndex - b.sessionIndex || a.attempt.order - b.attempt.order)
    .map(entry => entry.attempt)
}

export function itemProgress(itemId: string, sessions: Session[]) {
  const attempts = chronologicalAttempts(sessions, itemId).filter(attempt => !attempt.assisted)
  const recent = attempts.slice(-10)
  const correct = attempts.filter(attempt => attempt.outcome === 'correct').length
  let status = 'Belum dilatih'
  if (attempts.length) {
    if (recent.slice(-3).some(attempt => attempt.outcome === 'wrong' || attempt.outcome === 'skipped')) status = 'Perlu diulang'
    else if (attempts.length >= 10 && new Set(attempts.map(attempt => attempt.sessionId)).size >= 2 && recent.filter(attempt => attempt.outcome === 'correct').length >= 9) status = 'Lancar sementara'
    else status = 'Sedang dilatih'
  }
  return { status, total: attempts.length, correct, accuracy: attempts.length ? correct / attempts.length * 100 : 0 }
}

export function detectConfusion(attempt: Attempt, content: ContentItem[], groups: ConfusionGroup[]) {
  if (attempt.outcome !== 'wrong' || attempt.assisted) return null
  const prompt = content.find(item => item.id === attempt.itemId)
  if (!prompt || prompt.kind !== 'letter') return null
  const candidates = content.filter(item => item.script === prompt.script && item.kind === 'letter' && accepts(item, attempt.input))
  if (candidates.length !== 1 || candidates[0]!.id === prompt.id) return null
  return groups.find(group => group.ids.includes(prompt.id) && group.ids.includes(candidates[0]!.id)) || null
}

export function comparisonKey(session: Session) {
  const { language, script, kind, group, mode, count, source, itemIds, reviewIds } = session.config
  return JSON.stringify([language, script, kind, group, mode, count, source, [...itemIds].sort(), [...reviewIds].sort(), session.contentVersion, session.device])
}

export function isNewRecord(session: Session, sessions: Session[]) {
  if (!summarize(session).recordEligible) return false
  const peers = sessions.filter(other => other.id !== session.id && comparisonKey(other) === comparisonKey(session) && summarize(other).recordEligible)
  return peers.every(other => session.config.mode === 'sprint'
    ? summarize(session).correct > summarize(other).correct
    : session.activeMs < other.activeMs)
}

export const duration = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
export const responseTime = (ms: number | null) => ms === null ? 'Belum cukup data' : `${(ms / 1000).toFixed(1)} dtk`
