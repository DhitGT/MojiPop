<script setup lang="ts">
import type { PracticeConfig, Script, Session, Mode } from '~/types/learning'
import { content, contentById, confusionGroups, CONTENT_VERSION, scriptLabels } from '~/data/content'
import { makeQueue, selectPool } from '~/utils/learning'
import { practicePackages } from '~/data/practicePackages'
const route = useRoute()
const store = useLearningStore()
const showCustom = ref(Object.keys(route.query).length > 0)
const packages = computed(() => practicePackages(store.data.value.settings.language))
const packageCategory = ref('starter')
const packageFormat = ref('all')
const packageKind = ref('all')
const categories = [{ id: 'all', label: 'Semua' }, { id: 'starter', label: 'Mulai dari Nol' }, { id: 'letters', label: 'Huruf' }, { id: 'words', label: 'Kata' }, { id: 'challenge', label: 'Tantangan' }]
const filteredPackages = computed(() => packages.value.filter(pack =>
  (packageCategory.value === 'all' || pack.category === packageCategory.value)
  && (packageFormat.value === 'all' || pack.config.answerFormat === packageFormat.value)
  && (packageKind.value === 'all' || pack.config.kind === packageKind.value)))
function packageTiming(config: PracticeConfig) {
  return config.mode === 'sprint' ? '60 detik' : config.mode === 'attack' ? `${config.count} soal · kejar waktu` : `${config.count} soal · santai`
}
const saved = store.data.value.settings.lastConfig
const config = reactive<PracticeConfig>({
  language: store.data.value.settings.language, script: store.data.value.settings.language === 'ja' ? 'hiragana' : 'hangul',
  kind: 'letter', group: 'Vokal', mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [],
  ...(saved && saved.language === store.data.value.settings.language ? saved : {})
})
if (['choice', 'typing'].includes(String(route.query.format))) config.answerFormat = route.query.format as 'choice' | 'typing'
if (config.answerFormat === 'choice' && !route.query.mode) config.mode = 'sprint'
// Keep ordinary preferences, but never silently carry a targeted item pool into a new setup.
config.itemIds = []
config.reviewIds = []
if (['retry', 'pair'].includes(config.source)) config.source = 'random'
if (['hiragana', 'katakana', 'hangul'].includes(String(route.query.script))) {
  config.script = route.query.script as Script
  config.language = config.script === 'hangul' ? 'ko' : 'ja'
}
if (['letter', 'word'].includes(String(route.query.kind))) config.kind = route.query.kind as 'letter' | 'word'
if (['relaxed', 'attack', 'sprint'].includes(String(route.query.mode))) {
  config.mode = route.query.mode as Mode
  if (config.mode === 'attack' && config.count === 0) config.count = 10
}
if (route.query.group) config.group = String(route.query.group)
else if (config.script === 'hangul' && config.group === 'Vokal') config.group = 'Konsonan dasar'
if (config.kind === 'word' && !route.query.group) config.group = 'Semua'
const setupError = ref('')
const starting = ref(false)
const retrySession = route.query.retry ? store.data.value.sessions.find(session => session.id === route.query.retry) : null
const repeatSession = route.query.repeat ? store.data.value.sessions.find(session => session.id === route.query.repeat) : null
if ((route.query.retry && !retrySession) || (route.query.repeat && !repeatSession)) setupError.value = 'Sesi rujukan tidak ditemukan di browser ini. Pilih latihan baru.'
if (repeatSession) Object.assign(config, JSON.parse(JSON.stringify(repeatSession.config)))
if (retrySession) {
  Object.assign(config, JSON.parse(JSON.stringify(retrySession.config)))
  config.source = 'retry'
  config.reviewIds = [...new Set(retrySession.attempts.filter(attempt => attempt.outcome === 'wrong' || attempt.outcome === 'skipped').map(attempt => attempt.itemId))]
  const groups = new Set(config.reviewIds.map(id => contentById[id]?.group))
  const correctIds = retrySession.attempts.filter(attempt => attempt.outcome === 'correct' && groups.has(contentById[attempt.itemId]?.group)).map(attempt => attempt.itemId)
  config.itemIds = [...new Set([...config.reviewIds, ...correctIds])]
  if (!config.reviewIds.length) setupError.value = 'Sesi ini tidak memiliki kesalahan atau soal yang dilewati. Pilih latihan baru.'
}
if (route.query.items) {
  config.itemIds = String(route.query.items).split(',').filter(id => contentById[id])
  if (!config.itemIds.length) setupError.value = 'Materi yang dipilih tidak ditemukan.'
}
const pair = computed(() => confusionGroups.find(group => group.ids.join(',') === String(route.query.pair)))
if (route.query.pair) {
  if (pair.value) { config.itemIds = [...pair.value.ids]; config.reviewIds = []; config.source = 'pair' }
  else setupError.value = 'Pasangan pembanding tidak ditemukan. Pilih pasangan dari kartu materi.'
}
const isTargeted = computed(() => Boolean(route.query.items || route.query.retry || route.query.pair || route.query.repeat))
const availableGroups = computed(() => [...new Set(content.filter(item => item.script === config.script && item.kind === config.kind).map(item => item.group))])
const pool = computed(() => selectPool(config, content))
const modes: { id: Mode, title: string, icon: string, description: string }[] = [
  { id: 'relaxed', title: 'Santai', icon: 'spark', description: 'Tanpa timer. Kenali pelan-pelan, fokus pada akurasi.' },
  { id: 'attack', title: 'Time Attack', icon: 'clock', description: 'Selesaikan satu paket. Waktu dan akurasi berdampingan.' },
  { id: 'sprint', title: 'Sprint 60 detik', icon: 'bolt', description: 'Sebanyak yang kamu bisa dalam 60 detik aktif.' }
]
watch(() => config.script, script => { config.language = script === 'hangul' ? 'ko' : 'ja'; if (!isTargeted.value) config.group = 'Semua' })
watch(() => config.kind, () => { if (!isTargeted.value) config.group = 'Semua' })
watch(() => config.mode, mode => { if (mode === 'attack' && config.count === 0) config.count = 10 })
watch(() => store.data.value.settings.language, language => {
  if (showCustom.value) return
  Object.assign(config, { language, script: language === 'ja' ? 'hiragana' : 'hangul', kind: 'letter', group: 'Semua', itemIds: [], reviewIds: [], source: 'random' })
})
function setFormat(format: 'typing' | 'choice') {
  config.answerFormat = format
  if (format === 'choice') config.mode = 'sprint'
}
async function start() {
  if (!pool.value.length || setupError.value || starting.value) return
  starting.value = true
  const finalConfig: PracticeConfig = JSON.parse(JSON.stringify(config))
  if (finalConfig.mode === 'sprint') finalConfig.count = 0
  const session: Session = {
    id: crypto.randomUUID(), config: finalConfig, contentVersion: CONTENT_VERSION,
    device: matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard', startedAt: new Date().toISOString(),
    activeMs: 0, status: 'active', hasPaused: false, attempts: [], cursor: 0, unfinished: 0,
    queue: makeQueue(pool.value, finalConfig.count, finalConfig.reviewIds, finalConfig.source === 'benchmark')
  }
  store.setLastConfig(finalConfig)
  await store.saveSession(session)
  await navigateTo(`/arena?id=${session.id}`)
}
async function startPackage(packageConfig: PracticeConfig) {
  if (starting.value) return
  setupError.value = ''
  Object.assign(config, JSON.parse(JSON.stringify(packageConfig)))
  await start()
}
</script>

<template>
  <div class="setup-simple">
    <div class="page-heading"><h1>{{ showCustom ? 'Atur latihan' : 'Pilih latihan' }}</h1><LanguageSwitch v-if="!showCustom" /><NuxtLink v-else to="/materi" class="text-link">Pilih materi</NuxtLink></div>
    <NuxtLink to="/typing-race" class="panel race-entry"><span><strong><AppIcon name="bolt" :size="20" /> Typing Race</strong><small>Ketik romaji dari teks acak. Atur durasi, ukur WPM, dan balapan dengan ghost percobaanmu.</small></span><AppIcon name="arrow" :size="22" /></NuxtLink>
    <div class="practice-tabs" role="group" aria-label="Pilihan pengaturan latihan"><button type="button" :aria-pressed="!showCustom" @click="showCustom = false">Paket siap main</button><button type="button" :aria-pressed="showCustom" @click="showCustom = true">Atur sendiri</button></div>
    <section v-if="!showCustom" aria-label="Paket latihan">
      <div class="package-categories" role="group" aria-label="Kategori paket"><button v-for="category in categories" :key="category.id" type="button" :aria-pressed="packageCategory === category.id" @click="packageCategory = category.id">{{ category.label }} <span>{{ packages.filter(pack => category.id === 'all' || pack.category === category.id).length }}</span></button></div>
      <div class="package-filters"><div class="field"><label for="package-format">Jenis latihan</label><select id="package-format" v-model="packageFormat"><option value="all">Semua jenis</option><option value="choice">Pilihan ganda</option><option value="typing">Ketik sendiri</option></select></div><div class="field"><label for="package-kind">Materi</label><select id="package-kind" v-model="packageKind"><option value="all">Huruf dan kata</option><option value="letter">Huruf</option><option value="word">Kata</option></select></div></div>
      <p class="package-intro">{{ filteredPackages.length }} paket · Pilih, langsung main.</p>
      <div class="package-grid"><article v-for="(pack, index) in filteredPackages" :key="pack.id" :class="['practice-package', `package-color-${index % 4}`]"><div class="package-top"><span class="package-symbol" aria-hidden="true">{{ pack.symbol }}</span><span class="package-badge">{{ pack.badge }}</span></div><h2>{{ pack.title }}</h2><p>{{ pack.description }}</p><div class="package-type">{{ pack.config.answerFormat === 'typing' ? 'Ketik' : 'Pilihan ganda' }} · {{ pack.config.kind === 'letter' ? 'Huruf' : 'Kata' }}<span>{{ packageTiming(pack.config) }}</span></div><button class="button wide" :disabled="starting" :aria-label="`Main ${pack.title}`" @click="startPackage(pack.config)">Mulai <AppIcon name="play" :size="16" /></button></article></div>
      <div v-if="!filteredPackages.length" class="panel empty-state"><p>Belum ada paket dengan filter ini.</p><button class="text-button" @click="packageCategory = 'all'; packageFormat = 'all'; packageKind = 'all'">Lihat semua paket</button></div>
    </section>
    <template v-else>
    <div v-if="setupError" class="notice danger" role="alert">{{ setupError }} <NuxtLink to="/latihan" class="text-link">Latihan baru</NuxtLink></div>
    <div v-if="pair" class="notice"><strong>Perhatikan sebelum mulai: {{ pair.ids.map(id => contentById[id]?.glyph).join(' / ') }}</strong><p>{{ pair.note }}</p></div>
    <p v-if="retrySession" class="context-line">Mengulang kesalahan sesi sebelumnya.</p>
    <form class="setup-main" @submit.prevent="start()">
      <section>
        <h2 class="form-section-title">Cara menjawab</h2>
        <div class="answer-format"><button type="button" :class="['choice', { selected: config.answerFormat === 'choice' }]" :aria-pressed="config.answerFormat === 'choice'" @click="setFormat('choice')"><strong>Pilihan ganda</strong><small>Pilih bacaan romaji</small></button><button type="button" :class="['choice', { selected: config.answerFormat !== 'choice' }]" :aria-pressed="config.answerFormat !== 'choice'" @click="setFormat('typing')"><strong>Ketik</strong><small>Tulis sendiri bacaannya</small></button></div>
      </section>
      <section>
        <h2 class="form-section-title">Mode</h2>
        <div class="choice-grid"><button v-for="mode in modes" :key="mode.id" type="button" :class="['choice', { selected: config.mode === mode.id }]" :aria-pressed="config.mode === mode.id" @click="config.mode = mode.id"><AppIcon :name="mode.icon" :size="22" /><strong>{{ mode.title }}</strong><p>{{ mode.id === 'relaxed' ? 'Tanpa timer' : mode.id === 'attack' ? 'Kejar waktu' : 'Sebanyak mungkin' }}</p></button></div>
      </section>
      <section class="panel">
        <h2 class="form-section-title">Materi</h2>
        <template v-if="isTargeted">
          <div class="targeted-material"><strong>{{ scriptLabels[config.script] }}</strong><NuxtLink to="/latihan" class="text-link">Ganti materi</NuxtLink></div>
          <p class="targeted-glyphs">{{ pool.slice(0, 12).map(item => item.glyph).join(' · ') }}{{ pool.length > 12 ? '…' : '' }}</p>
        </template>
        <div v-else class="form-fields">
          <div class="field"><label for="practice-script">Tulisan</label><select id="practice-script" v-model="config.script"><option value="hiragana">Hiragana</option><option value="katakana">Katakana</option><option value="hangul">Hangul</option></select></div>
          <div class="field"><label for="practice-kind">Soal</label><select id="practice-kind" v-model="config.kind"><option value="letter">Huruf</option><option value="word">Kata</option></select></div>
          <div class="field"><label for="practice-group">Kelompok</label><select id="practice-group" v-model="config.group"><option>Semua</option><option v-for="g in availableGroups" :key="g">{{ g }}</option><option v-if="!availableGroups.includes(config.group) && config.group !== 'Semua'">{{ config.group }}</option></select></div>
        </div>
        <div v-if="config.mode !== 'sprint'" class="field count-field"><label for="count">Jumlah soal</label><select id="count" v-model.number="config.count"><option :value="10">10 soal</option><option :value="20">20 soal</option><option :value="30">30 soal</option><option v-if="config.mode === 'relaxed'" :value="0">Bebas</option></select></div>
        <p v-if="!pool.length" class="notice danger">Tidak ada soal di kelompok ini. Pilih kelompok lain.</p>
      </section>
      <details class="disclosure">
        <summary>Opsi lainnya</summary>
        <div v-if="!isTargeted" class="field"><label for="source">Susunan soal</label><select id="source" v-model="config.source"><option value="random">Acak</option><option value="benchmark">Paket tetap (benchmark)</option></select><p class="field-help">Paket tetap memakai soal yang sama dengan urutan diacak.</p></div>
        <p class="field-help">Enter untuk menjawab. Petunjuk tidak dihitung sebagai benar mandiri. Jeda atau pindah tab mengganti soal aktif dan membatalkan rekor kecepatan.</p>
        <p class="field-help">Rekor membutuhkan akurasi ≥90%. Hasil hanya dibandingkan pada pengaturan yang sama.</p>
      </details>
      <div class="setup-summary setup-start">
        <span>{{ config.mode === 'sprint' ? '60 detik' : config.count ? `${config.count} soal` : 'Sesi bebas' }} · {{ pool.length }} {{ config.kind === 'word' ? 'kata' : 'huruf' }}{{ pool.length < 4 ? ' (berulang)' : '' }}</span>
        <button class="button" :disabled="!pool.length || !!setupError || starting" type="submit">{{ starting ? 'Menyiapkan…' : 'Mulai latihan' }} <AppIcon name="arrow" :size="16" /></button>
      </div>
      <p v-if="config.mode === 'sprint'" class="field-help">Waktu tetap berjalan saat feedback. Soal terbuka saat waktu habis tidak dihitung salah.</p>
    </form>
    </template>
  </div>
</template>

<style scoped>
.race-entry { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; text-decoration: none; color: var(--accent); background: var(--accent-light); }
.race-entry strong { display: flex; align-items: center; gap: 8px; font-size: 17px; }
.race-entry small { display: block; margin-top: 8px; color: var(--muted); line-height: 1.6; }
.race-entry > svg { flex-shrink: 0; }
.race-entry:hover { border-color: var(--accent); }
</style>
