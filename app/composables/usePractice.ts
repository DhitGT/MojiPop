import type { Attempt, Session } from '~/types/learning'
import { contentById, content } from '~/data/content'
import { makeAttempt, makeQueue, makeChoices, selectPool } from '~/utils/learning'

export function usePractice(session: Ref<Session | undefined>) {
  const store = useLearningStore()
  const input = ref('')
  const assisted = ref(false)
  const feedback = ref<Attempt | null>(null)
  const elapsed = ref(0)
  const promptReady = ref(false)
  const inputElement = ref<HTMLInputElement | null>(null)
  const choiceElement = ref<HTMLElement | null>(null)
  const choices = ref<string[]>([])
  const current = computed(() => contentById[session.value?.queue[session.value.cursor] || ''])
  const paused = computed(() => session.value?.status === 'paused' || session.value?.status === 'interrupted')
  let clockStart = 0
  let baseMs = 0
  let promptStart = 0
  let heartbeat = 0
  let ticker: ReturnType<typeof setInterval> | undefined
  let transition: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let generation = 0

  function activeMs() {
    const value = session.value?.status === 'active' ? baseMs + performance.now() - clockStart : session.value?.activeMs || 0
    return session.value?.config.mode === 'sprint' ? Math.min(60000, value) : value
  }
  async function focusPrompt() {
    const currentGeneration = ++generation
    promptReady.value = false
    choices.value = current.value ? makeChoices(current.value, content) : []
    await nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    if (disposed || currentGeneration !== generation || session.value?.status !== 'active' || document.hidden) return
    promptStart = performance.now()
    promptReady.value = true
    await nextTick()
    inputElement.value?.focus()
    choiceElement.value?.querySelector<HTMLButtonElement>('button')?.focus()
  }
  async function finish(expired = false) {
    const s = session.value
    if (!s || s.status === 'completed') return
    s.activeMs = activeMs()
    s.unfinished = expired && !feedback.value && current.value ? 1 : 0
    const targetReached = s.config.mode === 'sprint' ? expired || s.activeMs >= 60000 : !s.config.count || s.attempts.length >= s.config.count
    s.status = targetReached ? 'completed' : 'interrupted'
    s.endedAt = new Date().toISOString()
    generation++
    promptReady.value = false
    clearTimeout(transition)
    clearInterval(ticker)
    await store.saveSession(s)
    if (!disposed) await navigateTo(`/hasil/${s.id}`)
  }
  function expired() {
    if (session.value?.config.mode === 'sprint' && activeMs() >= 60000) {
      void finish(true)
      return true
    }
    return false
  }
  function tick() {
    if (session.value?.status !== 'active') return
    elapsed.value = activeMs()
    if (expired()) return
    if (performance.now() - heartbeat > 5000) {
      heartbeat = performance.now()
      session.value.activeMs = elapsed.value
      void store.saveSession(session.value)
    }
  }
  function startClock() {
    baseMs = session.value?.activeMs || 0
    elapsed.value = baseMs
    clockStart = performance.now()
    heartbeat = clockStart
    clearInterval(ticker)
    ticker = setInterval(tick, 100)
  }
  async function next() {
    const s = session.value
    if (!s || s.status !== 'active' || !feedback.value || expired()) return
    clearTimeout(transition)
    if (s.config.mode !== 'sprint' && s.config.count && s.attempts.length >= s.config.count) return finish()
    s.cursor++
    if (s.cursor >= s.queue.length) {
      const pool = selectPool(s.config, content)
      s.queue.push(...makeQueue(pool, 30, s.config.reviewIds))
    }
    input.value = ''
    assisted.value = false
    feedback.value = null
    s.activeMs = activeMs()
    void store.saveSession(s)
    await focusPrompt()
  }
  function submit(skipped = false) {
    const s = session.value
    if (!s || !current.value || s.status !== 'active' || !promptReady.value || feedback.value || expired()) return
    if (!skipped && !input.value.trim()) return
    const attempt = makeAttempt(s, current.value, skipped ? '' : input.value, assisted.value, skipped, performance.now() - promptStart)
    s.attempts.push(attempt)
    feedback.value = attempt
    s.activeMs = activeMs()
    void store.saveSession(s)
    if (s.config.answerFormat === 'choice' || attempt.outcome === 'correct') transition = setTimeout(() => void next(), s.config.answerFormat === 'choice' ? 850 : store.data.value.settings.reducedMotion ? 150 : 650)
  }
  function choose(answer: string) {
    if (!choices.value.includes(answer) || feedback.value || !promptReady.value || session.value?.status !== 'active') return
    input.value = answer
    submit()
  }
  function hint() {
    if (session.value?.status === 'active' && promptReady.value && !feedback.value && !expired()) assisted.value = true
  }
  function pause() {
    const s = session.value
    if (!s || s.status !== 'active') return
    if (expired()) return
    s.activeMs = activeMs()
    elapsed.value = s.activeMs
    s.status = 'paused'
    s.hasPaused = true
    generation++
    promptReady.value = false
    clearTimeout(transition)
    void store.saveSession(s)
  }
  async function resume() {
    const s = session.value
    if (!s || !paused.value || document.hidden) return
    if (s.config.mode !== 'sprint' && s.config.count && s.attempts.length >= s.config.count) return finish()
    if (s.attempts.length > s.cursor) s.cursor++
    if (s.cursor >= s.queue.length) s.queue.push(...makeQueue(selectPool(s.config, content), 30, s.config.reviewIds))
    const candidates = selectPool(s.config, content).filter(item => item.id !== s.queue[s.cursor])
    // The unanswered prompt is replaced, never recorded as a wrong answer.
    if (candidates.length) s.queue[s.cursor] = candidates[Math.floor(Math.random() * candidates.length)]!.id
    input.value = ''
    feedback.value = null
    assisted.value = false
    s.hasPaused = true
    s.status = 'active'
    startClock()
    void store.saveSession(s)
    await focusPrompt()
  }
  function visibility() { if (document.hidden) pause() }
  function keyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); pause() }
  }
  onMounted(async () => {
    await document.fonts.ready
    if (disposed) return
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('keydown', keyboard)
    window.addEventListener('pagehide', pause)
    if (session.value?.status === 'completed') return navigateTo(`/hasil/${session.value.id}`)
    elapsed.value = session.value?.activeMs || 0
    if (session.value?.status === 'active') {
      startClock()
      if (document.hidden) pause()
      else await focusPrompt()
    }
  })
  onBeforeRouteLeave(() => { pause() })
  onBeforeUnmount(() => {
    pause()
    disposed = true
    generation++
    clearInterval(ticker)
    clearTimeout(transition)
    document.removeEventListener('visibilitychange', visibility)
    document.removeEventListener('keydown', keyboard)
    window.removeEventListener('pagehide', pause)
  })
  return { input, assisted, feedback, elapsed, promptReady, inputElement, choiceElement, choices, choose, current, paused, submit, hint, next, pause, resume, finish }
}
