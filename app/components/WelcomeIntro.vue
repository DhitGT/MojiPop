<script setup lang="ts">
const intro = useIntro()
const store = useLearningStore()
const dialog = ref<HTMLDialogElement | null>(null)
const heading = ref<HTMLElement | null>(null)
const step = ref(0)
const direction = ref('forward')
const demoAnswer = ref('')
const language = ref<'ja' | 'ko'>('ja')
const slides = [
  { tag: 'SELAMAT DATANG DI KANALEARN', title: 'Huruf baru. Dunia baru.', copy: 'Mulai kenal huruf Jepang dan Korea lewat langkah kecil yang terasa seperti bermain.', note: 'Dari “ini bacanya apa?” jadi “aku bisa!”', scene: 'welcome' },
  { tag: '01 / KENALI HURUFNYA', title: 'Yang asing, jadi akrab.', copy: 'Kenali Hiragana, Katakana, dan Hangul. Buka kartu huruf, lihat bacaannya, lalu pelajari contoh katanya.', note: 'Tidak perlu punya dasar. Mulai dari nol juga boleh.', scene: 'letters' },
  { tag: '02 / SELANGKAH DEMI SELANGKAH', title: 'Sedikit dulu. Lanjut lagi.', copy: 'Ikuti jalur materi dalam kelompok kecil. Kamu selalu punya langkah berikutnya tanpa bingung mulai dari mana.', note: 'Satu kelompok huruf. Satu pencapaian kecil.', scene: 'path' },
  { tag: '03 / COBA SENDIRI', title: 'Ternyata, kamu bisa.', copy: 'Latihan membantu huruf makin melekat. Coba mini latihan ini: huruf あ dibaca apa?', note: 'Di latihan, kamu bisa mengetik atau memilih jawaban.', scene: 'practice' },
  { tag: '04 / TEMUKAN RITMEMU', title: 'Santai? Ngebut? Kamu pilih.', copy: 'Belajar tanpa timer di mode Santai, kejar waktu di Time Attack, atau tantang diri lewat Sprint 60 detik.', note: 'Sesuaikan latihan dengan energi kamu hari ini.', scene: 'modes' },
  { tag: '05 / LIHAT PERKEMBANGANMU', title: 'Setiap percobaan berarti.', copy: 'Lihat akurasi dan riwayat latihanmu. Ulang jawaban yang belum tepat, lalu lanjutkan sesi yang sempat tertunda.', note: 'Progres tersimpan di browser ini. Bisa dicadangkan di Pengaturan.', scene: 'progress' },
  { tag: 'PETUALANGANMU DIMULAI', title: 'Mau mulai dari mana?', copy: 'Pilih bahasa pertamamu. Kiko siap menemani kamu mengenal huruf, satu langkah setiap kali.', note: 'Bisa ganti bahasa kapan saja. Tanpa perlu akun.', scene: 'start' }
] as const
const slide = computed(() => slides[step.value]!)
const last = computed(() => step.value === slides.length - 1)
let previousOverflow = ''
let scrollLocked = false
let previousFocus: HTMLElement | null = null

function unlock() {
  if (!scrollLocked) return
  document.body.style.overflow = previousOverflow
  scrollLocked = false
}
async function syncOpen(open: boolean) {
  await nextTick()
  if (open) {
    step.value = 0
    demoAnswer.value = ''
    language.value = store.data.value.settings.language
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    scrollLocked = true
    dialog.value?.showModal()
    await nextTick()
    heading.value?.focus()
  } else {
    dialog.value?.close()
    unlock()
    if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus()
    else document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true })
  }
}
watch(intro.open, syncOpen)
onMounted(intro.init)
onBeforeUnmount(unlock)

async function go(index: number) {
  if (index < 0 || index >= slides.length || index === step.value) return
  direction.value = index > step.value ? 'forward' : 'backward'
  step.value = index
  await nextTick()
  heading.value?.focus({ preventScroll: true })
}
async function start() {
  store.updateSettings({ language: language.value })
  intro.finish()
  await navigateTo({ path: '/materi', query: { script: language.value === 'ja' ? 'hiragana' : 'hangul' } })
}
function onKey(event: KeyboardEvent) {
  if (event.target instanceof HTMLButtonElement) return
  if (event.key === 'ArrowRight') { event.preventDefault(); void go(step.value + 1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); void go(step.value - 1) }
}
</script>

<template>
  <dialog ref="dialog" class="intro" :class="{ 'intro-still': store.data.value.settings.reducedMotion }" aria-labelledby="intro-title" aria-describedby="intro-description" @cancel.prevent="intro.finish" @keydown="onKey">
    <div class="intro-shell">
      <header class="intro-header">
        <span class="intro-brand"><span>か</span> KanaLearn<span class="intro-edition">HELLO, NEW WORLD</span></span>
        <button class="intro-skip" @click="intro.finish">Lewati intro <AppIcon name="close" :size="16" /></button>
      </header>
      <div class="intro-meter" role="progressbar" :aria-valuenow="step + 1" :aria-valuemin="1" :aria-valuemax="slides.length" aria-label="Progres intro"><span :style="{ width: `${(step + 1) / slides.length * 100}%` }" /></div>
      <div class="intro-stage" :data-direction="direction">
        <Transition name="intro-slide" mode="out-in" @after-enter="heading?.focus({ preventScroll: true })">
          <section :key="step" class="intro-slide">
            <div class="intro-copy">
              <span class="intro-tag">{{ slide.tag }}</span>
              <h1 id="intro-title" ref="heading" tabindex="-1">{{ slide.title }}</h1>
              <p id="intro-description">{{ slide.copy }}</p>
              <div v-if="slide.scene === 'start'" class="intro-languages" role="group" aria-label="Pilih bahasa pertama">
                <button v-for="option in (['ja', 'ko'] as const)" :key="option" :aria-pressed="language === option" @click="language = option"><span :lang="option">{{ option === 'ja' ? 'あ' : '한' }}</span><strong>{{ option === 'ja' ? 'Jepang' : 'Korea' }}</strong><AppIcon v-if="language === option" name="check" :size="18" /></button>
              </div>
              <p class="intro-note"><AppIcon name="spark" :size="17" />{{ slide.note }}</p>
            </div>
            <div class="intro-art" :class="`scene-${slide.scene}`">
              <div class="intro-orbit" aria-hidden="true" /><span class="intro-spark spark-a" aria-hidden="true">✦</span><span class="intro-spark spark-b" aria-hidden="true">✦</span>
              <template v-if="slide.scene === 'welcome' || slide.scene === 'start'">
                <span class="intro-floating glyph-a" lang="ja" aria-hidden="true">あ<small>JEPANG</small></span><span class="intro-floating glyph-b" lang="ko" aria-hidden="true">한<small>KOREA</small></span>
                <KikoMascot :celebrate="slide.scene === 'start'" />
                <span class="intro-sticker">{{ slide.scene === 'start' ? 'AYO, MULAI!' : 'Hai, aku Kiko!' }}</span>
              </template>
              <div v-else-if="slide.scene === 'letters'" class="intro-letter-stack">
                <div v-for="(glyph, index) in ['あ', 'ア', '한']" :key="glyph" class="intro-letter" :lang="index === 2 ? 'ko' : 'ja'"><small>{{ ['HIRAGANA', 'KATAKANA', 'HANGUL'][index] }}</small><strong>{{ glyph }}</strong><span>{{ ['a', 'a', 'han'][index] }}</span></div>
              </div>
              <div v-else-if="slide.scene === 'path'" class="intro-path">
                <div v-for="(group, index) in ['あ い う え お', 'か き く け こ', 'さ し す せ そ']" :key="group"><span>{{ index === 0 ? '✓' : `0${index + 1}` }}</span><strong lang="ja">{{ group }}</strong><small>{{ ['Mulai dari vokal', 'Lanjut kelompok K', 'Lalu kelompok S'][index] }}</small></div>
                <span class="intro-sticker">LANGKAH KECIL, MAJU TERUS.</span>
              </div>
              <div v-else-if="slide.scene === 'practice'" class="intro-demo">
                <span class="intro-tag">MINI LATIHAN · HIRAGANA</span><strong lang="ja">あ</strong><p>Pilih bacaannya</p>
                <div class="intro-answers"><button v-for="answer in ['a', 'i', 'u']" :key="answer" :class="{ chosen: demoAnswer === answer, correct: demoAnswer === answer && answer === 'a' }" :aria-pressed="demoAnswer === answer" @click="demoAnswer = answer">{{ answer }}</button></div>
                <p class="intro-feedback" aria-live="polite">{{ !demoAnswer ? 'Coba tebak. Salah juga tidak apa-apa.' : demoAnswer === 'a' ? '✓ Benar! あ dibaca “a”. Kamu bisa!' : 'Hampir! Petunjuk: あ dibaca “a”. Coba lagi.' }}</p>
              </div>
              <div v-else-if="slide.scene === 'modes'" class="intro-modes"><div v-for="(mode, index) in ['Santai', 'Time Attack', 'Sprint']" :key="mode"><span><AppIcon :name="['spark', 'clock', 'bolt'][index]!" :size="29" /></span><strong>{{ mode }}<small>{{ ['Nikmati prosesnya', 'Kejar waktunya', '60 detik. Let’s go!'][index] }}</small></strong></div></div>
              <div v-else class="intro-progress-card"><span class="intro-tag">GAMBARAN PROGRESMU</span><AppIcon name="chart" :size="38" /><strong>Makin kenal.<br>Makin percaya diri.</strong><div class="intro-bars" aria-hidden="true"><i v-for="height in [30, 46, 40, 65, 78, 94]" :key="height" :style="{ '--bar-height': `${height}%` }" /></div><span class="intro-example">Ilustrasi · setiap orang punya ritmenya</span></div>
            </div>
          </section>
        </Transition>
      </div>
      <footer class="intro-footer">
        <div class="intro-pagination"><span class="intro-count">0{{ step + 1 }} <span>/ 0{{ slides.length }}</span></span><div class="intro-dots" aria-label="Slide intro"><button v-for="(item, index) in slides" :key="item.scene" :aria-label="`Slide ${index + 1}: ${item.title}`" :aria-current="step === index ? 'step' : undefined" @click="go(index)"><span /></button></div></div>
        <div class="intro-actions"><button v-if="step > 0" class="intro-back" @click="go(step - 1)">Kembali</button><button class="button intro-next" @click="last ? start() : go(step + 1)">{{ last ? 'Mulai petualanganku' : step === 0 ? 'Kenalan dulu, yuk' : 'Lanjut' }}<AppIcon name="arrow" :size="19" /></button></div>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.intro { position: fixed; inset: 0; width: 100%; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 0; border: 0; color: var(--ink); background: #f8f9ef; overflow: auto; overscroll-behavior: contain; }
.intro::backdrop { background: #f8f9ef; }
.intro-shell { max-width: 1440px; min-height: 100%; margin: auto; display: flex; flex-direction: column; padding: 30px clamp(22px, 5vw, 80px); }
.intro-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 26px; }
.intro-brand { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 23px; letter-spacing: -1px; }
.intro-brand > span:first-child { display: grid; place-items: center; width: 38px; height: 40px; border: 2px solid #35265b; background: #683cf2; color: white; border-radius: 12px; box-shadow: 0 3px #35265b; }
.intro-brand .intro-edition { border-left: 1px solid #cbcbbc; padding-left: 18px; margin-left: 10px; font-size: 9px; letter-spacing: 2px; color: #68697a; }
.intro-skip { display: flex; align-items: center; gap: 8px; padding: 10px 0 10px 10px; color: #555970; font-size: 12px; font-weight: 700; }
.intro-meter { height: 4px; background: #e5e5dc; border-radius: 10px; overflow: hidden; }
.intro-meter > span { display: block; height: 100%; background: #683cf2; border-radius: inherit; transition: width .4s ease; }
.intro-stage { display: grid; align-items: center; flex: 1; min-height: 490px; padding: 38px 0; }
.intro-slide { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: clamp(24px, 5vw, 80px); width: 100%; }
.intro-tag { display: block; font-size: 10px; letter-spacing: 2px; color: #6037bd; font-weight: 900; }
.intro-copy h1 { font-size: clamp(42px, 5.5vw, 78px); line-height: 1.04; letter-spacing: -3px; max-width: 620px; margin: 22px 0; outline: none; }
.intro-copy > p { max-width: 450px; color: #5b6073; font-size: 16px; line-height: 1.8; }
.intro-copy .intro-note { display: flex; align-items: flex-start; gap: 9px; font-size: 12px; margin-top: 25px; color: #66558a; }
.intro-note svg { flex-shrink: 0; margin-top: 3px; }
.intro-art { position: relative; isolation: isolate; min-width: 0; min-height: 390px; display: flex; align-items: center; justify-content: center; border: 2px solid #35265b; border-radius: 44% 44% 26px 26px; background: #e9e0ff; box-shadow: 0 8px #35265b; }
.intro-orbit { position: absolute; width: 82%; aspect-ratio: 1; border: 1px dashed #b4a0dd; border-radius: 50%; z-index: -1; }
.intro-spark { position: absolute; font-size: 38px; color: #683cf2; animation: intro-twinkle 4s ease-in-out infinite; }
.spark-a { top: 9%; right: 10%; }.spark-b { left: 8%; bottom: 13%; font-size: 25px; animation-delay: 1s; }
.intro-art .kiko-mascot { width: 80%; height: 330px; z-index: 1; filter: drop-shadow(0 12px 0 #39245916); }
.intro-floating { position: absolute; display: grid; place-items: center; width: 90px; height: 108px; border: 2px solid #35265b; border-radius: 16px; font-size: 49px; font-weight: 800; box-shadow: 0 5px #35265b; z-index: 2; animation: intro-float 5s ease-in-out infinite; }
.intro-floating small { font-size: 8px; letter-spacing: 1px; margin-top: -12px; }
.glyph-a { top: 18%; left: -3%; background: #d7fb57; rotate: -12deg; }.glyph-b { bottom: 17%; right: -3%; background: #64deea; rotate: 12deg; animation-delay: -2s; }
.intro-sticker { position: absolute; bottom: 12px; left: 50%; translate: -50% 0; rotate: -4deg; padding: 10px 20px; background: #ffdf66; color: #35265b; border: 2px solid #35265b; border-radius: 10px; box-shadow: 0 4px #35265b; font-weight: 900; white-space: nowrap; z-index: 3; }
.intro-letter-stack { display: flex; align-items: center; justify-content: center; width: 100%; padding: 20px; }
.intro-letter { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 34%; padding: 20px 5px; border: 2px solid #35265b; border-radius: 17px; box-shadow: 0 6px #35265b; background: white; rotate: -10deg; }
.intro-letter small { font-size: 8px; letter-spacing: 1px; font-weight: 800; }.intro-letter strong { font-size: clamp(40px, 5vw, 68px); line-height: 1.5; }.intro-letter > span { font-size: 17px; font-weight: 800; }
.intro-letter:nth-child(2) { background: #d7fb57; rotate: 0deg; translate: 0 -22px; z-index: 1; }.intro-letter:nth-child(3) { background: #64deea; rotate: 10deg; }
.intro-path { width: 82%; display: grid; gap: 19px; padding-bottom: 20px; }.intro-path > div { display: grid; grid-template-columns: 39px 1fr; column-gap: 12px; border: 2px solid #35265b; border-radius: 14px; padding: 14px; background: white; box-shadow: 0 4px #35265b; }.intro-path > div:first-child { background: #d7fb57; }.intro-path > div:nth-child(2) { margin-left: 16px; }.intro-path > div:nth-child(3) { margin-left: 32px; }.intro-path > div > span { grid-row: span 2; align-self: center; width: 35px; height: 35px; display: grid; place-items: center; border-radius: 50%; background: #683cf2; color: white; font-weight: 900; }.intro-path strong { font-size: 21px; }.intro-path small { font-size: 10px; color: #5b6073; }.intro-path .intro-sticker { font-size: 10px; }
.intro-demo, .intro-progress-card { width: 83%; background: white; border: 2px solid #35265b; border-radius: 20px; box-shadow: 0 6px #35265b; padding: 24px; text-align: center; z-index: 1; }.intro-demo .intro-tag, .intro-progress-card .intro-tag { font-size: 8px; letter-spacing: 1px; }.intro-demo > strong { display: block; font-size: 85px; line-height: 1.5; }.intro-demo > p { font-size: 12px; color: #5b6073; }.intro-answers { display: flex; gap: 10px; margin: 16px 0; }.intro-answers button { flex: 1; border: 2px solid #d5cbe7; border-radius: 11px; min-height: 46px; font-size: 22px; font-weight: 900; background: #f6f1ff; }.intro-answers .chosen { border-color: #b74a35; background: #ffe4dd; }.intro-answers .correct { background: #d7fb57; border-color: #476028; }.intro-demo .intro-feedback { min-height: 37px; font-size: 11px; }
.intro-modes { width: 80%; display: grid; gap: 19px; }.intro-modes > div { display: flex; align-items: center; gap: 18px; padding: 18px; background: white; border: 2px solid #35265b; border-radius: 16px; box-shadow: 0 5px #35265b; rotate: -3deg; }.intro-modes > div:nth-child(2) { rotate: 3deg; background: #ffdf66; }.intro-modes > div:nth-child(3) { rotate: -2deg; background: #64deea; }.intro-modes > div > span { display: grid; place-items: center; width: 47px; height: 47px; background: #eee7ff; border-radius: 12px; color: #683cf2; }.intro-modes strong { font-size: 20px; }.intro-modes small { display: block; font-size: 11px; margin-top: 4px; font-weight: 500; }
.intro-progress-card { text-align: left; }.intro-progress-card > svg { margin: 16px 0 9px; color: #683cf2; }.intro-progress-card > strong { display: block; font-size: 25px; line-height: 1.15; letter-spacing: -1px; }.intro-bars { height: 100px; display: flex; align-items: flex-end; gap: 10px; margin: 18px 0 12px; border-bottom: 2px solid #35265b; }.intro-bars i { flex: 1; height: var(--bar-height); border: 2px solid #35265b; border-bottom: 0; border-radius: 6px 6px 0 0; background: #683cf2; transform-origin: bottom; animation: intro-grow .9s cubic-bezier(.2,.7,.2,1) both; }.intro-bars i:nth-child(even) { background: #d7fb57; }.intro-example { font-size: 9px; color: #5b6073; }
.intro-languages { display: flex; gap: 12px; margin-top: 22px; }.intro-languages button { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 2px solid #cfc9dd; border-radius: 14px; background: white; min-width: 140px; }.intro-languages button[aria-pressed='true'] { background: #eee7ff; border-color: #683cf2; box-shadow: 0 3px #683cf2; }.intro-languages button > span { font-size: 27px; }.intro-languages strong { font-size: 14px; }
.intro-footer { border-top: 1px solid #dcded0; padding-top: 23px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }.intro-pagination, .intro-actions { display: flex; align-items: center; gap: 24px; }.intro-count { font-size: 14px; font-weight: 900; white-space: nowrap; }.intro-count > span { color: #77798b; font-size: 11px; }.intro-dots { display: flex; gap: 0; }.intro-dots button { display: grid; place-items: center; width: 25px; min-height: 36px; }.intro-dots button > span { width: 7px; height: 7px; background: #c4c5ba; border-radius: 10px; transition: width .3s; }.intro-dots button[aria-current] > span { width: 20px; background: #683cf2; }.intro-back { min-height: 44px; padding: 8px; font-size: 12px; font-weight: 800; color: #5b6073; }.intro-next { min-width: 150px; background: #d7fb57; color: #28341a; border-color: #35265b; box-shadow: 0 4px #35265b; }.intro-next:hover { background: #e4ff8c; box-shadow: 0 6px #35265b; }
.intro-slide-enter-active, .intro-slide-leave-active { transition: opacity .2s ease, transform .2s ease; }.intro-slide-enter-from { opacity: 0; transform: translateX(32px); }.intro-slide-leave-to { opacity: 0; transform: translateX(-24px); }[data-direction='backward'] .intro-slide-enter-from { transform: translateX(-32px); }[data-direction='backward'] .intro-slide-leave-to { transform: translateX(24px); }
@keyframes intro-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }@keyframes intro-twinkle { 0%, 100% { transform: scale(1) rotate(0); } 50% { transform: scale(.8) rotate(25deg); } }@keyframes intro-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.intro-still *, .intro-still *::before, .intro-still *::after { animation: none !important; transition: none !important; }
.intro-still .intro-slide { transform: none !important; }
@media (min-width: 1500px) { .intro-stage { min-height: 600px; }.intro-art { min-height: 460px; } }
@media (max-width: 760px) { .intro-shell { padding: 19px 22px; }.intro-brand { font-size: 19px; }.intro-brand .intro-edition { display: none; }.intro-header { padding-bottom: 20px; }.intro-skip { font-size: 11px; }.intro-stage { min-height: 0; padding: 26px 0 30px; }.intro-slide { grid-template-columns: 1fr; gap: 24px; }.intro-copy h1 { font-size: clamp(37px, 9vw, 56px); letter-spacing: -1.8px; margin: 13px 0; max-width: 440px; }.intro-copy > p { font-size: 14px; }.intro-tag { font-size: 9px; letter-spacing: 1.5px; }.intro-copy .intro-note { margin-top: 13px; font-size: 11px; }.intro-art { min-height: 290px; width: min(100%, 430px); margin: auto; border-radius: 36px; }.intro-art .kiko-mascot { height: 260px; width: 68%; }.intro-floating { width: 73px; height: 87px; font-size: 37px; }.glyph-a { left: 3%; }.glyph-b { right: 3%; }.intro-sticker { font-size: 12px; padding: 8px 15px; bottom: 9px; }.intro-letter { padding: 14px 5px; gap: 8px; }.intro-letter strong { font-size: 48px; }.intro-path { gap: 13px; padding: 18px 0 45px; }.intro-path > div { padding: 9px; }.intro-path strong { font-size: 18px; }.intro-demo { margin: 18px 0; padding: 18px; }.intro-demo > strong { font-size: 64px; }.intro-modes { gap: 14px; padding: 20px 0; }.intro-modes > div { padding: 12px 16px; }.intro-modes strong { font-size: 17px; }.intro-progress-card { margin: 18px 0; padding: 20px; }.intro-progress-card > strong { font-size: 23px; }.intro-bars { height: 72px; }.intro-progress-card > svg { width: 29px; height: 29px; margin: 10px 0; }.intro-footer { flex-wrap: wrap; gap: 12px; padding-top: 15px; }.intro-pagination { justify-content: space-between; width: 100%; }.intro-actions { justify-content: flex-end; width: 100%; gap: 14px; }.intro-next { flex: 1; }.intro-back { padding: 8px 16px; }.intro-languages { gap: 10px; margin-top: 16px; }.intro-languages button { flex: 1; min-width: 0; padding: 9px 13px; } }
@media (prefers-reduced-motion: reduce) { .intro *, .intro *::before, .intro *::after { animation: none !important; transition: none !important; } .intro-slide { transform: none !important; } }
</style>
