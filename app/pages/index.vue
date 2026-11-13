<script setup lang="ts">
import { content, scriptLabels } from '~/data/content'
import { itemProgress } from '~/utils/learning'
import { studyPath } from '~/utils/curriculum'

const store = useLearningStore()
useHead({ title: 'KanaLearn · Belajar Jepang & Korea' })
const language = computed(() => store.data.value.settings.language)
const sessions = computed(() => store.data.value.sessions.filter(session => session.config.language === language.value))
const attempts = computed(() => sessions.value.flatMap(session => session.attempts))
const accuracy = computed(() => attempts.value.length ? Math.round(attempts.value.filter(attempt => attempt.outcome === 'correct').length / attempts.value.length * 100) : null)
const scripts = computed(() => language.value === 'ja' ? ['hiragana', 'katakana'] as const : ['hangul'] as const)
const unfinished = computed(() => [...sessions.value].reverse().find(session => session.status !== 'completed'))
const latest = computed(() => sessions.value.filter(session => session.status === 'completed').at(-1))
const needsReview = computed(() => latest.value?.attempts.some(attempt => ['wrong', 'skipped'].includes(attempt.outcome)))
const recommendedStep = computed(() => {
  const steps = studyPath(language.value === 'ja' ? 'hiragana' : 'hangul', content)
  return steps.find(step => step.items.some(item => itemProgress(item.id, sessions.value).total === 0)) || steps[0]!
})
const learningPath = computed(() => studyPath(language.value === 'ja' ? 'hiragana' : 'hangul', content))
const nextSteps = computed(() => {
  const index = learningPath.value.findIndex(step => step.id === recommendedStep.value.id)
  return learningPath.value.slice(index, index + 3)
})
const practicedInStep = computed(() => recommendedStep.value.items.filter(item => itemProgress(item.id, sessions.value).total > 0).length)
const quickPractice = (mode: 'relaxed' | 'attack' | 'sprint') => ({ path: '/latihan', query: {
  script: language.value === 'ja' ? 'hiragana' : 'hangul', kind: 'letter', group: recommendedStep.value.group,
  items: recommendedStep.value.items.map(item => item.id).join(','), mode
} })
const heroLink = computed(() => unfinished.value ? `/arena?id=${unfinished.value.id}` : needsReview.value ? `/latihan?retry=${latest.value!.id}` : {
  path: '/materi', query: { script: language.value === 'ja' ? 'hiragana' : 'hangul', step: recommendedStep.value.id }
})
function scriptStats(script: string) {
  const letters = content.filter(item => item.script === script && item.kind === 'letter')
  const practiced = letters.filter(item => itemProgress(item.id, sessions.value).total > 0).length
  return { total: letters.length, practiced, percent: Math.round(practiced / letters.length * 100) }
}
</script>

<template>
  <div class="home-simple game-home">
    <div class="page-heading"><h1>Mau belajar apa?</h1><LanguageSwitch /></div>
    <div class="game-dashboard"><div class="dashboard-primary">
    <section class="hero quest-hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <span class="quest-label"><AppIcon name="star" :size="14" />{{ scriptLabels[language === 'ja' ? 'hiragana' : 'hangul'] }}</span>
        <h2 id="hero-title">{{ unfinished ? 'Lanjutkan latihanmu.' : needsReview ? 'Ulang yang belum hafal.' : `Mulai dari ${recommendedStep.title}.` }}</h2>
        <p v-if="unfinished">{{ scriptLabels[unfinished.config.script] }} · {{ unfinished.attempts.length }} soal terjawab</p>
        <p v-else-if="needsReview">Latih lagi jawaban yang salah di sesi terakhir.</p>
        <div v-else class="quest-glyphs" :lang="language"><span v-for="item in recommendedStep.items" :key="item.id">{{ item.glyph }}</span></div>
        <NuxtLink :to="heroLink" class="button quest-button">{{ unfinished ? 'Lanjutkan sesi' : needsReview ? 'Ulang kesalahan' : 'Mulai belajar' }}<AppIcon name="arrow" :size="17" /></NuxtLink>
      </div>
      <div class="quest-mascot"><span class="mascot-star star-one" aria-hidden="true">✦</span><KikoMascot /><span class="mascot-name">KIKO</span><span class="mascot-star star-two" aria-hidden="true">✦</span></div>
    </section>
    <div class="section-title"><h2>Pilih materi</h2><NuxtLink to="/materi" class="text-link">Semua materi <AppIcon name="arrow" :size="14" /></NuxtLink></div>
    <div class="study-grid">
      <NuxtLink v-for="script in scripts" :key="script" :to="`/materi?script=${script}`" class="study-card">
        <span class="script-symbol">{{ script === 'hiragana' ? 'あ' : script === 'katakana' ? 'ア' : '한' }}</span>
        <h3>{{ scriptLabels[script] }}</h3>
        <p>{{ script === 'hangul' ? '24 huruf dasar' : '46 huruf dasar' }}</p>
        <div v-if="scriptStats(script).practiced" class="progress-bar"><span :style="{ width: `${scriptStats(script).percent}%` }" /></div>
        <span class="text-link">Buka materi <AppIcon name="arrow" :size="15" /></span>
      </NuxtLink>
    </div>
    <div class="section-title"><h2>Langsung latihan</h2></div>
    <div class="quick-modes"><NuxtLink :to="quickPractice('relaxed')" class="quick-mode"><span class="quick-icon"><AppIcon name="spark" :size="24" /></span><span><strong>Santai</strong><small>Tanpa timer</small></span><AppIcon name="arrow" :size="16" /></NuxtLink><NuxtLink :to="quickPractice('attack')" class="quick-mode"><span class="quick-icon"><AppIcon name="clock" :size="24" /></span><span><strong>Time Attack</strong><small>Kejar waktu</small></span><AppIcon name="arrow" :size="16" /></NuxtLink><NuxtLink :to="quickPractice('sprint')" class="quick-mode"><span class="quick-icon"><AppIcon name="bolt" :size="24" /></span><span><strong>Sprint</strong><small>60 detik</small></span><AppIcon name="arrow" :size="16" /></NuxtLink></div>
    </div>
    <aside class="dashboard-rail">
      <section class="rail-progress"><div class="rail-heading"><span class="rail-icon"><AppIcon name="target" :size="23" /></span><h2>{{ recommendedStep.items.length }} huruf dulu</h2></div><div class="rail-score"><strong>{{ practicedInStep }}<span>/{{ recommendedStep.items.length }}</span></strong><span>dicoba</span></div><div class="progress-bar"><span :style="{ width: `${practicedInStep / recommendedStep.items.length * 100}%` }" /></div></section>
      <section class="rail-path"><h2>Jalur belajarmu</h2><NuxtLink v-for="(step, index) in nextSteps" :key="step.id" :to="{ path: '/materi', query: { script: language === 'ja' ? 'hiragana' : 'hangul', step: step.id } }" class="rail-step"><span class="rail-step-number">{{ learningPath.findIndex(item => item.id === step.id) + 1 }}</span><span><strong>{{ step.title }}</strong><small :lang="language">{{ step.items.map(item => item.glyph).join(' ') }}</small></span><AppIcon :name="index === 0 ? 'play' : 'arrow'" :size="15" /></NuxtLink></section>
      <NuxtLink v-if="attempts.length" to="/progres" class="rail-history"><AppIcon name="chart" :size="21" /><span><strong>{{ accuracy }}% akurasi</strong><small>{{ sessions.filter(session => session.status === 'completed').length }} sesi selesai</small></span><AppIcon name="arrow" :size="15" /></NuxtLink>
      <p class="storage-caption">Progres di browser ini.<br><NuxtLink to="/pengaturan">Cadangkan progres</NuxtLink></p>
    </aside></div>
  </div>
</template>
