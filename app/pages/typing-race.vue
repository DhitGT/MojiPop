<script setup lang="ts">
import type { Kind, Script } from '~/types/learning'
import type { RaceFrame, RaceToken, RaceSample } from '~/utils/typingRace'
import { content, scriptLabels } from '~/data/content'
import { makeRace, raceMetrics, insertedRange, ghostPosition } from '~/utils/typingRace'
import { pickMascot } from '~/data/mascots'
import type { MascotId } from '~/data/mascots'

const store = useLearningStore()
const sounds = useSoundEffects()
const script = ref<Script>(store.data.value.settings.language === 'ko' ? 'hangul' : 'hiragana')
const kind = ref<Kind>('letter')
const seconds = ref(60)
const length = ref(100)
const showReading = ref(false)
const showGhost = ref(true)
const tokens = ref<RaceToken[]>([])
const input = ref('')
const phase = ref<'ready' | 'running' | 'finished'>('ready')
const mobileTyping = ref(false)
const elapsed = ref(0)
const strokes = ref(0)
const hits = ref(0)
const frames = ref<RaceFrame[]>([])
const samples = ref<RaceSample[]>([])
const resultsHeading = ref<HTMLElement>()
const previous = ref<{ frames: RaceFrame[]; wpm: number } | null>(null)
const field = ref<HTMLTextAreaElement>()
const source = ref<HTMLElement>()
const track = ref<HTMLElement>()
const mascotStroke = ref(0)
const mascotKey = ref('')
const mascotMistake = ref(false)
const raceMascot = ref<MascotId>('kiko')
let started = 0
let timer: ReturnType<typeof setInterval> | undefined
const target = computed(() => tokens.value.map(token => token.answer).join(' '))
const metrics = computed(() => raceMetrics(input.value, target.value, elapsed.value, hits.value, strokes.value))
const remaining = computed(() => Math.max(0, Math.ceil((seconds.value * 1000 - elapsed.value) / 1000)))
const ghost = computed(() => previous.value && showGhost.value ? ghostPosition(previous.value.frames, elapsed.value) : -1)
const activeToken = computed(() => tokens.value.findIndex(token => input.value.length <= token.end))
const actualLength = computed(() => tokens.value.reduce((sum, token) => sum + [...token.glyph].length, 0))

function stopTimer() { clearInterval(timer); timer = undefined }
function sample() {
  const point = { at: elapsed.value, wpm: metrics.value.wpm, raw: metrics.value.raw, accuracy: metrics.value.accuracy, errors: strokes.value - hits.value, strokes: strokes.value }
  if (samples.value.at(-1)?.at === point.at) samples.value[samples.value.length - 1] = point
  else samples.value.push(point)
}
function finish() {
  if (phase.value === 'finished') return
  stopTimer()
  sample()
  phase.value = 'finished'
  void sounds.play('complete')
  void nextTick(() => { resultsHeading.value?.focus(); resultsHeading.value?.scrollIntoView({ block: 'start' }) })
}
function tick() {
  elapsed.value = Math.min(performance.now() - started, seconds.value * 1000)
  if (Math.floor(elapsed.value / 1000) > Math.floor((samples.value.at(-1)?.at || 0) / 1000)) sample()
  if (elapsed.value >= seconds.value * 1000) finish()
}
function reset(repeat = false) {
  stopTimer()
  sounds.stop()
  mobileTyping.value = false
  raceMascot.value = pickMascot()
  if (repeat) {
    if (phase.value === 'finished' && frames.value.length) previous.value = { frames: [...frames.value], wpm: metrics.value.wpm }
  } else {
    previous.value = null
    tokens.value = makeRace(content.filter(item => item.script === script.value && item.kind === kind.value), length.value)
  }
  input.value = ''
  elapsed.value = 0
  strokes.value = 0
  hits.value = 0
  frames.value = []
  mascotStroke.value = 0
  mascotKey.value = ''
  mascotMistake.value = false
  samples.value = [{ at: 0, wpm: 0, raw: 0, accuracy: 100, errors: 0, strokes: 0 }]
  phase.value = 'ready'
  if (source.value) source.value.scrollTop = 0
  if (track.value) track.value.scrollTop = 0
}
function type(event: Event) {
  const element = event.target as HTMLTextAreaElement
  if (phase.value === 'finished') return
  if (phase.value === 'running') {
    tick()
    if (elapsed.value >= seconds.value * 1000) { element.value = input.value; return }
  }
  const value = element.value.replace(/[\r\n]/g, ' ').slice(0, target.value.length)
  if (value === input.value) return
  if (phase.value === 'ready' && value.length) {
    started = performance.now()
    phase.value = 'running'
    timer = setInterval(tick, 50)
  }
  const [start, end] = insertedRange(input.value, value)
  mascotKey.value = end > start ? value[end - 1]! : 'Backspace'
  mascotMistake.value = end > start && value[end - 1] !== target.value[end - 1]
  mascotStroke.value++
  if (end > start) void sounds.play(mascotMistake.value ? 'typo' : 'type')
  for (let index = start; index < end; index++) {
    strokes.value++
    if (value[index] === target.value[index]) hits.value++
  }
  input.value = value
  element.value = value
  // Bound memory during long runs with repeated corrections.
  if (frames.value.length < 30000) frames.value.push({ at: elapsed.value, position: value.length })
  if (value.length === target.value.length) { tick(); finish() }
}
async function repeat() { reset(true); await nextTick(); field.value?.focus() }
async function fresh() { reset(); await nextTick(); field.value?.focus() }
function follow(container: HTMLElement | undefined, selector: string) {
  const marker = container?.querySelector<HTMLElement>(selector)
  if (!container || !marker) return
  const top = marker.getBoundingClientRect().top - container.getBoundingClientRect().top
  if (top < 0 || top + marker.offsetHeight > container.clientHeight) container.scrollTop += top - container.clientHeight / 3
}
function focusEnd() {
  field.value?.focus()
  field.value?.setSelectionRange(input.value.length, input.value.length)
}
async function keepPromptVisible() {
  if (!matchMedia('(max-width: 680px)').matches || document.activeElement !== field.value) return
  mobileTyping.value = true
  await nextTick()
  if (document.activeElement === field.value) source.value?.scrollIntoView({ block: 'start' })
}
watch([script, kind, seconds, length], () => reset())
watch(() => input.value.length, async () => {
  await nextTick()
  follow(source.value, '.current-word')
  follow(track.value, '.caret')
})
onMounted(() => {
  reset()
  window.visualViewport?.addEventListener('resize', keepPromptVisible)
})
onBeforeUnmount(() => {
  stopTimer()
  sounds.stop()
  window.visualViewport?.removeEventListener('resize', keepPromptVisible)
})
</script>

<template>
  <div class="race-page">
    <div class="page-heading"><div><span class="eyebrow">BACA · KETIK · BALAP</span><h1>Typing Race</h1><p>Baca hurufnya, ketik romajinya, kejar ritmemu sendiri.</p></div><NuxtLink to="/latihan" class="text-link">Kembali ke latihan</NuxtLink></div>

    <section v-if="phase !== 'finished'" class="panel race-settings" aria-label="Pengaturan typing race">
      <fieldset :disabled="phase === 'running'">
        <div class="field"><label for="race-script">Tulisan</label><select id="race-script" v-model="script"><option v-for="(label, value) in scriptLabels" :key="value" :value="value">{{ label }}</option></select></div>
        <div class="field"><label for="race-kind">Isi teks</label><select id="race-kind" v-model="kind"><option value="letter">Huruf acak</option><option value="word">Kata acak</option></select></div>
        <div class="field"><label for="race-duration">Durasi</label><select id="race-duration" v-model.number="seconds"><option v-for="duration in [15, 30, 60, 120, 300]" :key="duration" :value="duration">{{ duration }} detik</option></select></div>
        <div class="field"><label for="race-length">Panjang teks</label><select id="race-length" v-model.number="length"><option v-for="count in [50, 100, 250, 500, 1000]" :key="count" :value="count">{{ count }} karakter</option></select></div>
      </fieldset>
      <div class="race-options"><label><input v-model="showReading" type="checkbox"> Tampilkan petunjuk romaji</label><label><input v-model="showGhost" type="checkbox"> Ghost percobaan terakhir</label></div>
    </section>

    <section v-if="phase !== 'finished'" class="panel race-board" :class="{ 'mobile-typing': mobileTyping }" aria-label="Arena typing race">
      <div class="race-stats"><div><strong role="timer">{{ remaining }}<small>dtk</small></strong><span>Sisa waktu</span></div><div><strong>{{ metrics.wpm }}</strong><span>WPM</span></div><div><strong>{{ metrics.accuracy }}<small>%</small></strong><span>Akurasi</span></div><div><strong>{{ input.length }}<small>/ {{ target.length }}</small></strong><span>Karakter romaji</span></div></div>
      <div class="race-progress" aria-hidden="true"><span :style="{ width: `${target.length ? input.length / target.length * 100 : 0}%` }" /></div>
      <div class="race-source-label"><span>{{ scriptLabels[script] }} · {{ actualLength }} karakter{{ kind === 'word' ? ' · kata utuh' : '' }}</span><span>Urutan acak</span></div>
      <div ref="source" class="race-source" :lang="script === 'hangul' ? 'ko' : 'ja'" aria-label="Teks untuk dibaca"><span v-for="(token, index) in tokens" :key="index" :class="{ 'current-word': index === activeToken, 'passed-word': input.length > token.end }">{{ token.glyph }}</span></div>
      <div class="race-legend"><span><i class="you-dot" /> Kamu</span><span v-if="previous && showGhost"><i class="ghost-dot" /> Ghost · {{ previous.wpm }} WPM</span><span v-else>Spasi di antara setiap huruf atau kata</span></div>
      <div class="race-typing-area"><div class="race-input-column">
      <label for="race-input" class="race-input-label">Ketik romaji di sini</label>
      <div class="race-editor" @click="focusEnd">
        <div ref="track" class="race-track" aria-hidden="true"><span v-for="(char, index) in target + ' '" :key="index" :class="{ caret: index === input.length, ghost: index === ghost, correct: index < input.length && input[index] === char, wrong: index < input.length && input[index] !== char, pending: index >= input.length }">{{ index < input.length ? (input[index] === ' ' ? '\u00a0' : input[index]) : index === target.length ? '\u00a0' : char === ' ' ? '\u00a0' : showReading ? char : '·' }}</span></div>
        <textarea id="race-input" ref="field" :value="input" :disabled="!tokens.length" :maxlength="target.length" rows="3" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="off" :spellcheck="false" aria-describedby="race-help" aria-label="Ketik romaji di sini" @focus="keepPromptVisible" @click="focusEnd" @keydown.left.prevent @keydown.right.prevent @keydown.up.prevent @keydown.down.prevent @input="type" @paste.prevent @drop.prevent @beforeinput="($event as InputEvent).inputType === 'insertFromPaste' && $event.preventDefault()" />
      </div>
      </div><TypingRaceMascot :stroke="mascotStroke" :typed-key="mascotKey" :character="raceMascot" :mistake="mascotMistake" /></div>
      <p id="race-help">Gunakan bacaan standar materi, misalnya shi, chi, tsu. Backspace untuk memperbaiki. Selesai saat waktu habis atau seluruh teks terketik. Waktu tetap berjalan saat berpindah tab.</p>
      <p v-if="phase === 'ready'" class="race-status" role="status">Siap. Timer mulai dari ketikan pertama{{ previous && showGhost ? ' bersama ghost percobaan terakhir' : '' }}.</p>
      <p v-else-if="phase === 'running'" class="race-status">Teruskan! {{ metrics.correct }} karakter tepat.</p>
      <div class="race-actions"><button class="button" @click="repeat"><AppIcon name="repeat" :size="16" /> Ulangi teks</button><button class="button secondary" @click="fresh">Teks acak baru <AppIcon name="spark" :size="16" /></button></div>
      <p class="race-footnote">Ghost merekam posisi dan waktu ketikan, termasuk backspace. Tersedia setelah race selesai, selama halaman ini terbuka.</p>
    </section>
    <section v-else class="race-result" aria-labelledby="race-result-title">
      <div class="result-heading"><div><span class="eyebrow">HASIL TYPING RACE</span><h2 id="race-result-title" ref="resultsHeading" tabindex="-1">Race selesai!</h2><p>{{ input.length === target.length ? 'Seluruh teks sudah terketik.' : 'Waktu habis.' }} Ini ritme ketikanmu.</p></div><span class="pill">{{ showReading ? 'Dengan petunjuk romaji' : 'Tanpa petunjuk' }}</span></div>
      <TypingRaceResults :samples="samples" :wpm="metrics.wpm" :raw="metrics.raw" :accuracy="metrics.accuracy" :elapsed="elapsed" :correct="metrics.correct" :wrong="input.length - metrics.correct" :missing="target.length - input.length" :strokes="strokes" :errors="strokes - hits" :previous-wpm="previous?.wpm" :script-label="scriptLabels[script]" :kind-label="kind === 'word' ? 'Kata acak' : 'Huruf acak'" :source-length="actualLength" :duration="seconds" />
      <div class="race-actions result-actions"><button class="button" @click="repeat"><AppIcon name="repeat" :size="18" /> Ulangi teks + ghost</button><button class="button secondary" @click="fresh"><AppIcon name="spark" :size="18" /> Teks acak baru</button></div>
      <p class="race-footnote">Ulangi teks yang sama untuk melawan ghost dari hasil ini, atau pilih teks baru untuk mengganti pengaturan.</p>
    </section>
  </div>
</template>

<style scoped>
.race-page { max-width: 1000px; margin: auto; }
.page-heading p { margin-top: 10px; color: var(--muted); }
.race-settings { margin-bottom: 24px; }
.race-settings fieldset { border: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; min-width: 0; }
.race-settings fieldset:disabled { opacity: .6; }
.race-settings .field { min-width: 0; }
.race-settings select { min-width: 0; min-height: 44px; }
.race-options { display: flex; flex-wrap: wrap; gap: 16px 28px; margin-top: 20px; font-size: 12px; color: var(--muted); }
.race-options label { display: flex; align-items: center; gap: 8px; }
.race-options input { accent-color: var(--accent); }
.race-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.race-stats strong { display: block; color: var(--accent); font-size: clamp(22px, 4vw, 38px); font-variant-numeric: tabular-nums; }
.race-stats small { font-size: 12px; margin-left: 4px; font-weight: 500; }
.race-stats span { color: var(--muted); font-size: 11px; }
.race-progress { height: 5px; background: var(--accent-light); border-radius: 8px; margin: 24px 0; overflow: hidden; }
.race-progress span { display: block; height: 100%; background: var(--accent); transition: width 80ms; }
.race-source-label, .race-legend { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 11px; color: var(--muted); }
.race-source { display: flex; flex-wrap: wrap; align-content: start; gap: 8px 12px; max-height: 220px; overflow: auto; padding: 16px 4px; margin: 8px 0 22px; font-size: clamp(24px, 3.5vw, 34px); line-height: 1.7; }
.race-source span { padding: 0 5px; border-bottom: 3px solid transparent; border-radius: 5px; overflow-wrap: anywhere; max-width: 100%; }
.race-source .current-word { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
.passed-word { opacity: .45; }
.race-legend { justify-content: start; gap: 20px; }
.race-legend span { display: inline-flex; align-items: center; gap: 6px; }
.race-legend i { width: 9px; height: 9px; border-radius: 3px; }
.you-dot { background: var(--accent); }.ghost-dot { background: #d58a39; }
.race-editor { position: relative; margin-top: 10px; border: 2px solid var(--line); border-radius: 12px; background: #faf8ff; overflow: hidden; cursor: text; }
.race-editor:focus-within { outline: 3px solid var(--accent-light); border-color: var(--accent); }
.race-track { font: 20px/1.9 ui-monospace, Consolas, monospace; overflow: auto; overflow-wrap: anywhere; height: 180px; padding: 16px; scrollbar-width: thin; }
.race-track span { position: relative; white-space: pre-wrap; }
.race-track .pending { color: #a79cb7; }.race-track .correct { color: #33856c; }.race-track .wrong { color: #b4354b; background: #fce4e9; }
.caret::before, .ghost::after { content: ''; position: absolute; left: -1px; top: 0; width: 2px; height: 1.25em; background: var(--accent); }
.ghost::after { left: 1px; background: #d58a39; opacity: .65; height: 1.5em; top: -.15em; }
.race-typing-area { display: grid; grid-template-columns: minmax(0, 1fr) 150px; align-items: end; gap: 16px; margin-top: 18px; }
.race-input-column { min-width: 0; }
.race-input-label { display: block; font-size: 12px; font-weight: 650; }
/* Native input handles keyboards and accessibility; the shared surface paints feedback and both cursors. */
textarea { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; resize: none; font-size: 20px; }
#race-help, .race-footnote { color: var(--muted); font-size: 11px; line-height: 1.7; margin-top: 12px; }
.race-status { font-size: 12px; color: var(--accent); margin: 20px 0; }
.result-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 8px 0 30px; flex-wrap: wrap; }
.result-heading h2 { font-size: 30px; outline: none; scroll-margin-top: 24px; }.result-heading p { color: var(--muted); margin-top: 8px; font-size: 13px; }
.result-actions { justify-content: center; padding-top: 12px; }.race-result > .race-footnote { text-align: center; }
.race-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
@media (max-width: 680px) {
  .race-settings, .race-board { padding: 16px; }
  .race-settings { margin-bottom: 16px; }
  .race-settings fieldset { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 10px; }
  .race-settings select { font-size: 16px; padding-inline: 8px; }
  .race-options { gap: 4px; margin-top: 12px; }
  .race-options label { min-height: 44px; width: 100%; }
  .race-options input { width: 18px; height: 18px; flex-shrink: 0; }
  .race-stats { gap: 8px; }
  .race-stats strong { font-size: 24px; overflow-wrap: anywhere; }
  .race-stats small { font-size: 10px; }
  .race-stats > div:last-child small { display: block; margin-left: 0; }
  .race-stats span { font-size: 10px; }
  .race-progress { margin: 16px 0; }
  .race-source { max-height: 132px; gap: 4px 8px; padding-block: 8px; margin-bottom: 14px; overscroll-behavior-y: contain; scroll-margin-top: 12px; }
  .race-legend { gap: 8px 14px; }
  .race-typing-area { grid-template-columns: minmax(0, 1fr) 80px; gap: 8px; margin-top: 12px; }
  .race-input-column { display: contents; }
  .race-input-label { grid-column: 1; grid-row: 1; align-self: end; padding-bottom: 4px; }
  .race-editor { grid-column: 1 / -1; grid-row: 2; margin-top: 0; }
  .race-typing-area :deep(.typing-mascot) { grid-column: 2; grid-row: 1; width: 80px; padding-top: 0; }
  .race-typing-area :deep(.mascot-caption) { display: none; }
  .race-track { height: 120px; font-size: 18px; padding: 12px; overscroll-behavior-y: contain; }
  .race-board.mobile-typing .race-source { max-height: 84px; }
  .race-board.mobile-typing .race-track { height: 84px; }
  .race-actions { gap: 10px; }
  .race-actions .button { flex: 1 1 100%; font-size: 13px; }
}
</style>
