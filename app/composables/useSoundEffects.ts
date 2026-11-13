export type SoundEffect = 'correct' | 'wrong' | 'hint' | 'skip' | 'complete' | 'achievement' | 'type' | 'typo'
type Note = [frequency: number, offset: number, duration: number]
type Voice = { oscillator: OscillatorNode; gain: GainNode; released: boolean }
type Channel = 'feedback' | 'celebration' | 'typing'

const melodies: Record<SoundEffect, Note[]> = {
  achievement: [[880, 0, 0.11], [1109, 0.1, 0.11], [1319, 0.2, 0.14], [1760, 0.32, 0.36]],
  correct: [[659, 0, 0.1], [988, 0.09, 0.18]],
  wrong: [[233, 0, 0.12], [175, 0.11, 0.18]],
  hint: [[523, 0, 0.1], [659, 0.1, 0.14]],
  skip: [[440, 0, 0.1], [330, 0.09, 0.12]],
  complete: [[523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14], [1047, 0.44, 0.42], [784, 0.44, 0.42], [659, 0.44, 0.42]],
  type: [[740, 0, 0.035]],
  typo: [[185, 0, 0.065]]
}
const levels: Record<SoundEffect, number> = { correct: 0.22, wrong: 0.16, hint: 0.16, skip: 0.14, complete: 0.14, achievement: 0.12, type: 0.055, typo: 0.08 }

// One engine across routes lets a session fanfare finish on the results page.
let context: AudioContext | undefined
let master: GainNode | undefined
const channels: Record<Channel, Set<Voice>> = { feedback: new Set(), celebration: new Set(), typing: new Set() }
const requests: Record<Channel, number> = { feedback: 0, celebration: 0, typing: 0 }
let lastTypingAt = -Infinity

function stopVoices(active: Set<Voice>) {
  if (!context) return
  const now = context.currentTime
  for (const voice of active) {
    if (voice.released) continue
    voice.released = true
    // Fade instead of cutting a waveform mid-cycle. onended releases both nodes.
    voice.gain.gain.cancelAndHoldAtTime(now)
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.015)
    voice.oscillator.stop(now + 0.02)
  }
}

export function useSoundEffects() {
  const store = useLearningStore()
  const enabled = computed(() => store.data.value.settings.soundEffects)
  const volume = computed(() => store.data.value.settings.soundVolume)

  function stop() {
    for (const channel of Object.keys(channels) as Channel[]) {
      requests[channel]++
      stopVoices(channels[channel])
    }
    lastTypingAt = -Infinity
  }

  function syncVolume() {
    if (!context || !master) return
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setTargetAtTime(enabled.value ? (volume.value / 100) ** 2 : 0, now, 0.015)
  }

  watch([enabled, volume], () => {
    syncVolume()
    if (!enabled.value || volume.value === 0) stop()
  }, { flush: 'sync' })

  function engine() {
    if (!import.meta.client || !enabled.value || volume.value === 0 || document.hidden) return
    const AudioEngine = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioEngine) return
    if (!context || context.state === 'closed') {
      context = new AudioEngine()
      master = context.createGain()
      master.gain.value = (volume.value / 100) ** 2
      master.connect(context.destination)
    }
    return context
  }

  // Called directly from a gesture, including before a timer ends a sprint.
  function unlock() {
    try {
      const audio = engine()
      if (audio && audio.state !== 'running') void audio.resume().catch(() => {})
    } catch { /* Audio support must never interrupt practice. */ }
  }

  async function play(effect: SoundEffect) {
    const channel: Channel = effect === 'achievement' ? 'celebration' : effect === 'type' || effect === 'typo' ? 'typing' : 'feedback'
    const request = ++requests[channel]
    try {
      const audio = engine()
      if (!audio) return
      const requestedAt = performance.now()
      if (audio.state !== 'running') await audio.resume()
      // Never replay stale feedback after mute, tab changes, or a newer request.
      if (request !== requests[channel] || !enabled.value || volume.value === 0 || document.hidden || audio.state !== 'running' || performance.now() - requestedAt > 300) return
      if (channel === 'typing') {
        if (requestedAt - lastTypingAt < 45) return
        lastTypingAt = requestedAt
      }
      const active = channels[channel]
      stopVoices(active)
      if (effect === 'complete') {
        requests.typing++
        stopVoices(channels.typing)
      }
      const start = audio.currentTime + 0.005
      for (const [frequency, offset, duration] of melodies[effect]) {
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        const voice: Voice = { oscillator, gain, released: false }
        oscillator.type = effect === 'type' || effect === 'typo' ? 'triangle' : 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0, start + offset)
        gain.gain.linearRampToValueAtTime(levels[effect], start + offset + 0.006)
        gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration)
        gain.gain.linearRampToValueAtTime(0, start + offset + duration + 0.015)
        oscillator.connect(gain)
        gain.connect(master!)
        active.add(voice)
        oscillator.onended = () => { active.delete(voice); oscillator.disconnect(); gain.disconnect() }
        oscillator.start(start + offset)
        oscillator.stop(start + offset + duration + 0.02)
      }
    } catch { /* Unsupported or blocked audio leaves the exercise usable. */ }
  }

  function toggle(value: boolean) {
    store.updateSettings({ soundEffects: value })
    if (value) void play('correct')
    else stop()
  }

  function setVolume(value: number) {
    if (!Number.isFinite(value)) return
    store.updateSettings({ soundVolume: Math.max(0, Math.min(100, value)) })
  }

  return { enabled, volume, play, unlock, toggle, setVolume, stop }
}
