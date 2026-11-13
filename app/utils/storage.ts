import type { PracticeConfig, ProgressData, Session } from '../types/learning'

const DB_NAME = 'kanalearn-v1'
const SETTINGS_KEY = 'kanalearn-settings-v1'
export const defaultSettings = () => ({ language: 'ja' as const, reducedMotion: false, lastConfig: null })
export const emptyProgress = (): ProgressData => ({ schemaVersion: 1, sessions: [], settings: defaultSettings() })

let connection: Promise<IDBDatabase> | undefined
function database() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('Penyimpanan terhalang tab lain. Tutup tab KanaLearn lainnya.'))
    }).catch(error => { connection = undefined; throw error })
  }
  return connection
}

export async function readSessions(): Promise<Session[]> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const request = db.transaction('sessions', 'readonly').objectStore('sessions').getAll()
    request.onsuccess = () => resolve((request.result as Session[]).sort((a, b) => a.startedAt.localeCompare(b.startedAt)))
    request.onerror = () => reject(request.error)
  })
}

export async function persistSession(session: Session) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite')
    tx.objectStore('sessions').put(JSON.parse(JSON.stringify(session)))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function readSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return defaultSettings()
  const settings = JSON.parse(raw)
  if (!settings || !['ja', 'ko'].includes(settings.language) || typeof settings.reducedMotion !== 'boolean') throw new Error('Preferensi tersimpan tidak valid.')
  return { language: settings.language, reducedMotion: settings.reducedMotion, lastConfig: validConfig(settings.lastConfig) ? settings.lastConfig : null }
}

export const persistSettings = (settings: ProgressData['settings']) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

export async function replaceSessions(sessions: Session[]) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite')
    const store = tx.objectStore('sessions')
    store.clear()
    sessions.forEach(session => store.put(JSON.parse(JSON.stringify(session))))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

const text = (value: unknown, max = 500): value is string => typeof value === 'string' && value.length <= max
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 20000 && value.every(id => text(id, 100))

export function validConfig(value: unknown): value is PracticeConfig {
  if (!value || typeof value !== 'object') return false
  const c = value as PracticeConfig
  if (c.answerFormat !== undefined && !['typing', 'choice'].includes(c.answerFormat)) return false
  return ['ja', 'ko'].includes(c.language) && ['hiragana', 'katakana', 'hangul'].includes(c.script)
    && (c.language === 'ko' ? c.script === 'hangul' : c.script !== 'hangul')
    && ['letter', 'word'].includes(c.kind) && ['relaxed', 'attack', 'sprint'].includes(c.mode)
    && [0, 10, 20, 30].includes(c.count) && (c.count !== 0 || c.mode !== 'attack')
    && ['random', 'benchmark', 'retry', 'pair'].includes(c.source)
    && text(c.group, 80) && stringArray(c.itemIds) && stringArray(c.reviewIds)
}

export function validateImport(raw: string, knownIds: Set<string>): ProgressData {
  if (raw.length > 10_000_000) throw new Error('File terlalu besar. Batas impor 10 MB.')
  let data: ProgressData
  try { data = JSON.parse(raw) } catch { throw new Error('File bukan JSON yang valid.') }
  const fail = () => { throw new Error('Format progres tidak valid atau versi belum didukung. Data lama tetap aman.') }
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.sessions) || data.sessions.length > 5000) return fail()
  const prefs = data.settings
  if (!prefs || !['ja', 'ko'].includes(prefs.language) || typeof prefs.reducedMotion !== 'boolean' || (prefs.lastConfig !== null && !validConfig(prefs.lastConfig))) return fail()
  const ids = new Set<string>()
  const allAttempts = new Set<string>()
  for (const session of data.sessions) {
    if (!session || !text(session.id, 100) || !session.id || ids.has(session.id) || !validConfig(session.config)
      || !text(session.contentVersion, 100) || !['touch', 'keyboard'].includes(session.device)
      || !text(session.startedAt, 50) || !Number.isFinite(Date.parse(session.startedAt))
      || (session.endedAt !== undefined && (!text(session.endedAt, 50) || !Number.isFinite(Date.parse(session.endedAt))))
      || !finite(session.activeMs) || typeof session.hasPaused !== 'boolean'
      || !['active', 'paused', 'interrupted', 'completed'].includes(session.status)
      || !Array.isArray(session.attempts) || session.attempts.length > 10000
      || !stringArray(session.queue) || !session.queue.length || !Number.isInteger(session.cursor) || session.cursor < 0 || session.cursor >= session.queue.length
      || ![0, 1].includes(session.unfinished)) return fail()
    ids.add(session.id)
    if ([...session.queue, ...session.config.itemIds, ...session.config.reviewIds].some(id => !knownIds.has(id))) return fail()
    for (const [index, attempt] of session.attempts.entries()) {
      if (!attempt || !text(attempt.id, 150) || !attempt.id || allAttempts.has(attempt.id) || attempt.sessionId !== session.id
        || attempt.order !== index || !knownIds.has(attempt.itemId) || !text(attempt.input, 100)
        || !['correct', 'wrong', 'assisted', 'skipped'].includes(attempt.outcome) || !finite(attempt.responseMs)
        || (attempt.answeredAt !== undefined && (!text(attempt.answeredAt, 50) || !Number.isFinite(Date.parse(attempt.answeredAt))))
        || typeof attempt.assisted !== 'boolean' || typeof attempt.accepted !== 'boolean'
        || (attempt.outcome === 'correct' && (!attempt.accepted || attempt.assisted))
        || (attempt.outcome === 'wrong' && (attempt.accepted || attempt.assisted))
        || (attempt.outcome === 'assisted' && !attempt.assisted)
        || (attempt.outcome === 'skipped' && attempt.accepted)) return fail()
      allAttempts.add(attempt.id)
    }
    if (session.status === 'active' || session.status === 'paused') {
      session.status = 'interrupted'
      session.hasPaused = true
    }
  }
  data.sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  return JSON.parse(JSON.stringify(data)) as ProgressData
}
