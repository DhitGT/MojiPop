<script setup lang="ts">
import type { Script } from '~/types/learning'
import type { CampaignInterview } from '~/types/campaign'
import { scriptLabels } from '~/data/content'

const script = defineModel<Script>('script', { required: true })
const props = defineProps<{ initialAnswers: CampaignInterview }>()
const emit = defineEmits<{ submit: [answers: CampaignInterview]; draft: [answers: CampaignInterview]; close: [] }>()
const store = useLearningStore()
const answers = reactive({ ...props.initialAnswers })
const dialog = ref<HTMLDialogElement>()
const heading = ref<HTMLElement>()
const step = ref(0)
const direction = ref('forward')
const slides = [
  { tag: 'KENALAN DULU, YUK', title: 'Kita mulai dari mana?', copy: 'Pilih huruf yang ingin kamu pelajari. Aku akan bantu menemukan langkah pertama yang cocok.', bubble: 'Hai, aku Kiko! Kita cari jalur belajarmu, yuk.' },
  { tag: '01 / PENGALAMANMU', title: 'Sudah sejauh mana?', copy: 'Tidak perlu sudah bisa. Ceritakan pengalamanmu dengan huruf ini.', bubble: 'Baru mulai juga boleh. Aku temani dari dasar!' },
  { tag: '02 / TUJUANMU', title: 'Ingin bisa apa dulu?', copy: 'Pilih yang paling ingin kamu capai. Kita mulai dari langkah kecil menuju ke sana.', bubble: 'Satu tujuan kecil bikin langkah kita lebih terarah.' },
  { tag: '03 / RITMEMU', title: 'Punya waktu berapa?', copy: 'Berapa menit yang nyaman untuk belajar setiap hari? Pelan-pelan juga tetap maju.', bubble: 'Tidak perlu buru-buru. Kita ikuti ritmemu.' },
  { tag: 'SIAP MENEMUKAN TITIK MULAI', title: 'Sekarang, coba sedikit.', copy: 'Tes singkat akan membantu memilih bab pertamamu. Tidak ada batas waktu dan tidak perlu takut salah.', bubble: 'Kalau belum tahu, bilang saja. Kita belajar bareng setelah ini!' }
] as const
const slide = computed(() => slides[step.value]!)
let previousOverflow = ''
let previousFocus: HTMLElement | null = null

watch(answers, () => emit('draft', { ...answers }))
onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
  await nextTick()
  heading.value?.focus()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  else document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true })
})
function go(next: number) {
  if (next < 0 || next >= slides.length) return
  direction.value = next > step.value ? 'forward' : 'backward'
  step.value = next
  dialog.value?.scrollTo({ top: 0 })
}
function next() {
  if (step.value === slides.length - 1) emit('submit', { ...answers })
  else go(step.value + 1)
}
</script>

<template>
  <dialog ref="dialog" class="interview-screen" :class="{ still: store.data.value.settings.reducedMotion }" aria-labelledby="interview-title" aria-describedby="interview-description" @cancel.prevent="emit('close')">
    <div class="interview-shell">
      <header class="interview-header"><span class="interview-brand"><span lang="ja">か</span>KanaLearn<small>PERJALANAN BELAJAR</small></span><button class="interview-exit" @click="emit('close')">Nanti dulu <AppIcon name="close" :size="17" /></button></header>
      <progress :value="step + 1" :max="slides.length" aria-label="Progres wawancara" />
      <div class="interview-stage" :data-direction="direction">
        <Transition name="interview-slide" mode="out-in" @after-enter="heading?.focus({ preventScroll: true })">
          <section :key="step" class="interview-slide">
            <div class="interview-copy"><span class="eyebrow">{{ slide.tag }} · {{ scriptLabels[script] }}</span><h1 id="interview-title" ref="heading" tabindex="-1">{{ slide.title }}</h1><p id="interview-description">{{ slide.copy }}</p>
              <div v-if="step === 0" class="interview-options script-options" role="group" aria-label="Jalur belajar"><button v-for="s in (['hiragana', 'katakana', 'hangul'] as const)" :key="s" :aria-label="scriptLabels[s]" :aria-pressed="script === s" @click="script = s"><span class="script-symbol" aria-hidden="true" :lang="s === 'hangul' ? 'ko' : 'ja'">{{ s === 'hangul' ? '한' : s === 'katakana' ? 'ア' : 'あ' }}</span><strong>{{ scriptLabels[s] }}</strong><AppIcon v-if="script === s" name="check" :size="18" /></button></div>
              <fieldset v-else-if="step === 1" class="interview-options"><legend class="sr-only">Sejauh mana kamu sudah belajar?</legend><label v-for="option in [{ value: 'new', title: 'Baru mulai', detail: 'Belum kenal hurufnya, atau ingin mulai dari nol.' }, { value: 'some', title: 'Sudah kenal beberapa', detail: 'Ada yang ingat, ada yang masih tertukar.' }, { value: 'confident', title: 'Sudah cukup lancar', detail: 'Ingin mengecek fondasi dan melanjutkan belajar.' }]" :key="option.value" :class="{ picked: answers.experience === option.value }"><input v-model="answers.experience" type="radio" name="experience" :value="option.value"><span><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span></label></fieldset>
              <fieldset v-else-if="step === 2" class="interview-options"><legend class="sr-only">Apa tujuanmu?</legend><label v-for="option in [{ value: 'foundation', title: 'Mengenal huruf dari dasar', detail: 'Bentuk dan bunyinya dulu, satu per satu.' }, { value: 'reading', title: 'Mulai membaca kata', detail: 'Menghubungkan huruf menjadi kata sederhana.' }, { value: 'review', title: 'Menguatkan yang pernah dipelajari', detail: 'Mengingat lagi dan mengurangi yang tertukar.' }]" :key="option.value" :class="{ picked: answers.goal === option.value }"><input v-model="answers.goal" type="radio" name="goal" :value="option.value"><span><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span></label></fieldset>
              <fieldset v-else-if="step === 3" class="interview-options"><legend class="sr-only">Waktu belajar per hari</legend><label v-for="option in [{ value: 5, title: '5 menit', detail: 'Pelan-pelan, satu langkah kecil.' }, { value: 10, title: '10 menit', detail: 'Rutin sedikit, mulai terbiasa.' }, { value: 15, title: '15 menit', detail: 'Lebih banyak waktu untuk mencoba.' }]" :key="option.value" :class="{ picked: answers.minutes === option.value }"><input v-model="answers.minutes" type="radio" name="minutes" :value="option.value"><span><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span></label></fieldset>
              <div v-else class="interview-ready"><div><AppIcon name="book" /><span>Jalur <strong>{{ scriptLabels[script] }}</strong></span></div><div><AppIcon name="clock" /><span>Ritme <strong>{{ answers.minutes }} menit sehari</strong></span></div><p>3–12 soal · tanpa timer. Pilih <strong>“Belum tahu”</strong> kalau belum mengenalnya. Kamu tetap bisa memilih mulai dari nol.</p></div>
            </div>
            <aside class="interview-companion" aria-label="Kiko menemani wawancara"><p class="interview-bubble" aria-live="polite">{{ slide.bubble }}</p><div class="interview-mascot"><span class="interview-orbit" aria-hidden="true" /><span class="interview-spark" aria-hidden="true">✦</span><KikoMascot :celebrate="step === slides.length - 1" /><span class="interview-sticker">{{ step === slides.length - 1 ? 'KITA COBA BARENG!' : 'SATU LANGKAH SETIAP KALI' }}</span></div></aside>
          </section>
        </Transition>
      </div>
      <footer class="interview-footer"><span class="interview-count">0{{ step + 1 }} <span>/ 0{{ slides.length }}</span></span><div class="interview-actions"><button v-if="step > 0" class="interview-back" @click="go(step - 1)">Kembali</button><button class="button interview-next" @click="next">{{ step === slides.length - 1 ? 'Lanjut ke tes penempatan' : 'Lanjut' }}<AppIcon name="arrow" :size="18" /></button></div></footer>
    </div>
  </dialog>
</template>

<style scoped>
.interview-screen { position: fixed; inset: 0; width: 100%; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 0; border: 0; background: var(--paper); color: var(--ink); overflow: auto; overscroll-behavior: contain; }
.interview-screen::backdrop { background: var(--paper); }
.interview-shell { min-height: 100%; max-width: 1440px; margin: auto; display: flex; flex-direction: column; padding: 28px clamp(22px, 5vw, 80px); }
.interview-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 24px; }
.interview-brand { display: flex; gap: 10px; align-items: center; font-size: 23px; font-weight: 850; letter-spacing: -1px; }
.interview-brand > span { display: grid; place-items: center; width: 38px; height: 40px; background: var(--accent); color: var(--surface); border-radius: 12px; box-shadow: 0 3px var(--ink); }
.interview-brand small { font-size: 9px; letter-spacing: 2px; color: var(--muted); padding-left: 18px; margin-left: 8px; border-left: 1px solid var(--line); }
.interview-exit, .interview-back { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; color: var(--muted); font-weight: 700; font-size: 12px; padding: 8px; }
.interview-screen progress { appearance: none; width: 100%; height: 4px; border: 0; background: var(--line); border-radius: 10px; overflow: hidden; flex-shrink: 0; }
.interview-screen progress::-webkit-progress-bar { background: var(--line); }
.interview-screen progress::-webkit-progress-value { background: var(--accent); transition: width .3s; }
.interview-screen progress::-moz-progress-bar { background: var(--accent); }
.interview-stage { flex: 1; display: grid; align-items: center; padding: 40px 0; }
.interview-slide { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(32px, 6vw, 90px); align-items: center; min-width: 0; }
.interview-copy { min-width: 0; }
.interview-copy h1 { font-size: clamp(38px, 4.6vw, 68px); letter-spacing: -2.5px; line-height: 1.08; margin: 18px 0; outline: none; }
.interview-copy > p { color: var(--muted); font-size: 15px; max-width: 480px; }
.interview-options { display: grid; gap: 12px; border: 0; padding: 0; margin: 26px 0 0; min-width: 0; }
.interview-options label, .script-options button { display: flex; gap: 14px; align-items: center; padding: 17px 20px; border: 2px solid var(--line); border-radius: 16px; background: var(--surface); color: var(--ink); cursor: pointer; text-align: left; }
.interview-options .picked, .script-options button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-light); box-shadow: 0 3px var(--accent); }
.interview-options input { width: 18px; height: 18px; accent-color: var(--accent); flex-shrink: 0; }
.interview-options strong { font-size: 15px; }
.interview-options small { display: block; color: var(--muted); line-height: 1.5; font-size: 12px; margin-top: 5px; }
.script-options .script-symbol { margin: 0; width: 42px; height: 42px; font-size: 28px; flex-shrink: 0; }
.script-options svg { margin-left: auto; color: var(--accent); }
.interview-companion { min-width: 0; }
.interview-bubble { position: relative; border: 2px solid var(--accent); border-radius: 22px 22px 22px 5px; background: var(--surface); padding: 20px 24px; font-size: 17px; font-weight: 650; max-width: 380px; margin: 0 auto 22px; box-shadow: 0 4px var(--accent-light); }
.interview-mascot { position: relative; isolation: isolate; display: grid; place-items: center; min-height: 300px; }
.interview-orbit { position: absolute; width: 85%; max-width: 330px; aspect-ratio: 1; border: 1px dashed var(--accent); border-radius: 50%; background: var(--accent-light); z-index: -1; }
.interview-mascot :deep(.kiko-mascot) { width: 90%; max-width: 350px; height: 300px; }
.interview-spark { position: absolute; right: 7%; top: 8%; font-size: 40px; color: var(--accent); }
.interview-sticker { background: #d7fb57; color: #28341a; border: 2px solid #35265b; box-shadow: 0 4px #35265b; border-radius: 10px; padding: 10px 16px; font-size: 10px; font-weight: 850; letter-spacing: 1px; rotate: -3deg; margin-top: -12px; z-index: 1; }
.interview-ready { margin-top: 26px; padding: 24px; border: 2px solid var(--line); background: var(--surface); border-radius: 18px; }
.interview-ready > div { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.interview-ready svg { color: var(--accent); flex-shrink: 0; }
.interview-ready strong { display: inline-block; }
.interview-ready p { border-top: 1px solid var(--line); padding-top: 16px; color: var(--muted); font-size: 13px; }
.interview-footer { display: flex; justify-content: space-between; align-items: center; gap: 18px; border-top: 1px solid var(--line); padding: 22px 0 8px; }
.interview-count { font-weight: 850; white-space: nowrap; }
.interview-count > span { color: var(--muted); font-size: 11px; margin-left: 6px; }
.interview-actions { display: flex; align-items: center; gap: 18px; }
.interview-next { background: #d7fb57; border-color: #35265b; color: #28341a; box-shadow: 0 4px #35265b; min-width: 140px; }
.interview-next:hover { background: #e4ff8c; }
.interview-slide-enter-active, .interview-slide-leave-active { transition: opacity .18s ease, transform .18s ease; }
.interview-slide-enter-from { opacity: 0; transform: translateX(28px); }
.interview-slide-leave-to { opacity: 0; transform: translateX(-22px); }
[data-direction='backward'] .interview-slide-enter-from { transform: translateX(-28px); }
[data-direction='backward'] .interview-slide-leave-to { transform: translateX(22px); }
.still *, .still *::before, .still *::after { transition: none !important; animation: none !important; }
@media (max-width: 760px) {
  .interview-shell { padding: 18px 22px; }
  .interview-header { padding-bottom: 16px; }
  .interview-brand { font-size: 20px; }
  .interview-brand small { display: none; }
  .interview-slide { grid-template-columns: 1fr; gap: 22px; }
  .interview-stage { padding: 26px 0; }
  .interview-copy h1 { font-size: 38px; letter-spacing: -1.7px; }
  .interview-copy > p { font-size: 13px; }
  .interview-companion { display: flex; align-items: center; gap: 14px; grid-row: 1; }
  .interview-mascot { min-height: 100px; width: 110px; flex-shrink: 0; order: -1; }
  .interview-mascot :deep(.kiko-mascot) { width: 110px; height: 110px; }
  .interview-orbit { width: 94px; }
  .interview-bubble { font-size: 12px; padding: 12px 14px; margin: 0; border-radius: 16px 16px 16px 5px; }
  .interview-sticker, .interview-spark { display: none; }
  .interview-options { margin-top: 20px; }
  .interview-options label, .script-options button { padding: 14px; }
  .interview-footer { padding-top: 16px; gap: 10px; }
  .interview-actions { gap: 8px; }
  .interview-next { min-width: 100px; font-size: 12px; padding: 12px; }
  .interview-count { font-size: 12px; }
}
@media (max-width: 380px) {
  .interview-shell { padding-inline: 16px; }
  .interview-copy h1 { font-size: 34px; }
  .interview-count { display: none; }
  .interview-actions { width: 100%; justify-content: flex-end; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
</style>
