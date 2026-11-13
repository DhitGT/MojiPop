import type { PracticeConfig, ProgressData, Session, Preferences } from '~/types/learning'
import { emptyProgress, readSessions, readSettings, persistSession, persistSettings, replaceSessions, validateImport } from '~/utils/storage'
import { contentById } from '~/data/content'

export function useLearningStore() {
  const data = useState<ProgressData>('learning-data', emptyProgress)
  const ready = useState('learning-ready', () => false)
  const loading = useState('learning-loading', () => false)
  const storageError = useState('learning-storage-error', () => '')
  const busy = useState('learning-storage-busy', () => false)
  function report(error: unknown) {
    storageError.value = `Progres belum bisa disimpan di browser. Tetap berlatih dan ekspor data sebelum menutup halaman. ${error instanceof Error ? error.message : ''}`
  }
  async function init() {
    if (ready.value || loading.value || !import.meta.client) return
    loading.value = true
    try { data.value.settings = readSettings() } catch (error) { report(error) }
    try {
      const sessions = await readSessions()
      data.value.sessions = sessions
      for (const session of sessions) {
        if (session.status === 'active' || session.status === 'paused') {
          session.status = 'interrupted'
          session.hasPaused = true
          await persistSession(session)
        }
      }
    } catch (error) { report(error) }
    ready.value = true
    loading.value = false
  }
  async function saveSession(session: Session) {
    const index = data.value.sessions.findIndex(other => other.id === session.id)
    if (index < 0) data.value.sessions.push(session)
    else data.value.sessions[index] = session
    try { await persistSession(session) } catch (error) { report(error) }
  }
  function updateSettings(update: Partial<Preferences>) {
    data.value.settings = { ...data.value.settings, ...update }
    try { persistSettings(data.value.settings) } catch (error) { report(error) }
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify(data.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kanalearn-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function replaceData(next: ProgressData) {
    busy.value = true
    try {
      await replaceSessions(next.sessions)
      data.value = next
      storageError.value = ''
      try { persistSettings(next.settings) } catch (error) { report(error) }
    } finally { busy.value = false }
  }
  const parseImport = (raw: string) => validateImport(raw, new Set(Object.keys(contentById)))
  const reset = () => replaceData(emptyProgress())
  const setLastConfig = (config: PracticeConfig) => updateSettings({ lastConfig: JSON.parse(JSON.stringify(config)), language: config.language })
  return { data, ready, loading, busy, storageError, init, saveSession, updateSettings, exportProgress, replaceData, parseImport, reset, setLastConfig }
}
