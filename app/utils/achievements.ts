import type { ContentItem, Session } from '../types/learning'
import { chronologicalAttempts } from './learning.ts'
import { dailyActivity, localDateKey } from './activity.ts'

export const achievementTracks = [
  { id: 'mastered', name: 'Mahir huruf', icon: 'book', unit: 'huruf', description: 'Raih status lancar pada huruf berbeda: 10 percobaan mandiri di minimal 2 sesi, 9 dari 10 terakhir benar, tanpa salah atau lewati pada 3 terakhir.', targets: [1, 5, 10, 20, 30, 50, 75, 100, 150, 200] },
  { id: 'explored', name: 'Penjelajah huruf', icon: 'spark', unit: 'huruf', description: 'Coba huruf berbeda dalam latihan.', targets: [1, 5, 10, 25, 50, 75, 100, 150, 200] },
  { id: 'correct', name: 'Jawaban benar', icon: 'check', unit: 'jawaban', description: 'Jawab benar secara mandiri, tanpa petunjuk.', targets: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] },
  { id: 'sessions', name: 'Rajin belajar', icon: 'play', unit: 'sesi', description: 'Selesaikan sesi latihan dengan minimal satu jawaban.', targets: [1, 3, 5, 10, 25, 50, 100, 250, 500, 1000] },
  { id: 'days', name: 'Hari belajar', icon: 'clock', unit: 'hari', description: 'Berlatih pada hari berbeda. Tidak harus berurutan.', targets: [1, 3, 7, 14, 30, 60, 100, 180, 365] },
  { id: 'dailyStreak', name: 'Streak harian', icon: 'bolt', unit: 'hari beruntun', description: 'Catat minimal satu jawaban setiap hari berturut-turut, mengikuti tanggal lokal perangkat.', targets: [2, 3, 7, 14, 21, 30, 60, 100, 180, 365] },
  { id: 'answerStreak', name: 'Benar beruntun', icon: 'target', unit: 'benar beruntun', description: 'Jawab benar mandiri berturut-turut, termasuk antar sesi. Salah, petunjuk, atau lewati memutus rangkaian.', targets: [3, 5, 10, 20, 30, 50, 75, 100, 200, 500] },
  { id: 'perfect', name: 'Sesi sempurna', icon: 'star', unit: 'sesi sempurna', description: 'Selesaikan sesi dengan minimal 10 jawaban, semuanya benar tanpa petunjuk.', targets: [1, 3, 5, 10, 25, 50, 100] },
  { id: 'words', name: 'Perbendaharaan kata', icon: 'book', unit: 'kata', description: 'Jawab benar mandiri untuk kata berbeda.', targets: [1, 5, 10, 20, 30, 50, 75, 100] },
] as const

export type AchievementMetric = typeof achievementTracks[number]['id']
const independentCorrect = (a: Session['attempts'][number]) => a.outcome === 'correct' && !a.assisted

/** Derived from portable session history, including older backups. Best records never regress. */
export function achievementProgress(sessions: Session[], content: ContentItem[], now = new Date()) {
  const metrics: Record<AchievementMetric, number> = { mastered: 0, explored: 0, correct: 0, sessions: 0, days: 0, dailyStreak: 0, answerStreak: 0, perfect: 0, words: 0 }
  const items = new Map(content.map(item => [item.id, item]))
  const histories = new Map<string, Session['attempts']>()
  const mastered = new Set<string>(), explored = new Set<string>(), words = new Set<string>()
  let answerRun = 0
  for (const attempt of chronologicalAttempts(sessions)) {
    const correct = independentCorrect(attempt)
    if (correct) metrics.correct++
    answerRun = correct ? answerRun + 1 : 0
    metrics.answerStreak = Math.max(metrics.answerStreak, answerRun)
    const item = items.get(attempt.itemId)
    if (item?.kind === 'word' && correct) words.add(item.id)
    if (item?.kind !== 'letter') continue
    explored.add(item.id)
    if (attempt.assisted || mastered.has(item.id)) continue
    const history = histories.get(item.id) ?? []
    history.push(attempt)
    histories.set(item.id, history)
    const recent = history.slice(-10)
    if (history.length >= 10 && new Set(history.map(a => a.sessionId)).size >= 2
      && recent.filter(independentCorrect).length >= 9 && recent.slice(-3).every(independentCorrect)) mastered.add(item.id)
  }
  metrics.mastered = mastered.size
  metrics.explored = explored.size
  metrics.words = words.size
  metrics.sessions = sessions.filter(s => s.status === 'completed' && s.attempts.length > 0).length
  metrics.perfect = sessions.filter(s => s.status === 'completed' && s.attempts.length >= 10 && s.attempts.every(independentCorrect)).length
  const today = localDateKey(now)
  const dates = [...dailyActivity(sessions).keys()].filter(key => key <= today).sort()
  metrics.days = dates.length
  let run = 0, previous = '', currentDailyStreak = 0
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  for (const key of dates) {
    const preceding = new Date(`${key}T12:00:00`); preceding.setDate(preceding.getDate() - 1)
    run = localDateKey(preceding) === previous ? run + 1 : 1
    previous = key
    metrics.dailyStreak = Math.max(metrics.dailyStreak, run)
    if (key === today || key === localDateKey(yesterday)) currentDailyStreak = run
  }
  const achievements = achievementTracks.flatMap(track => track.targets.map((target, index) => ({
    id: `${track.id}-${target}`, track: track.id, name: `${track.name} ${index + 1}`, icon: track.icon,
    tier: index + 1, target, value: Math.min(target, metrics[track.id]), unit: track.unit,
    unlocked: metrics[track.id] >= target, percent: Math.min(100, Math.floor(metrics[track.id] / target * 100)),
  })))
  return { metrics, currentDailyStreak, achievements, unlocked: achievements.filter(a => a.unlocked).length }
}
