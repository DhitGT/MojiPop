const INTRO_KEY = 'kanalearn-intro-v1'

export function useIntro() {
  const open = useState('intro-open', () => false)
  const checked = useState('intro-checked', () => false)

  function init() {
    if (checked.value || !import.meta.client) return
    checked.value = true
    try { open.value = localStorage.getItem(INTRO_KEY) !== 'done' }
    catch { open.value = true }
  }

  function finish() {
    open.value = false
    // The tour must still close when browser storage is unavailable.
    try { localStorage.setItem(INTRO_KEY, 'done') } catch { /* Keep the app usable. */ }
  }

  return { open, init, finish, replay: () => { open.value = true } }
}
