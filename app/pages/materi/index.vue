<script setup lang="ts">
import type { Script, Kind } from '~/types/learning'
import { content, scriptLabels } from '~/data/content'
import { itemProgress } from '~/utils/learning'
import { studyPath, wordsForStep } from '~/utils/curriculum'

const store = useLearningStore()
const route = useRoute()
useHead({ title: 'Materi belajar · KanaLearn' })
const script = ref<Script>(store.data.value.settings.language === 'ja' ? 'hiragana' : 'hangul')
const kind = ref<Kind>('letter')
const group = ref('Semua')
const stepId = ref('')
const hideAnswers = ref(false)
const search = ref('')
const path = computed(() => studyPath(script.value, content))
const selectedStep = computed(() => path.value.find(step => step.id === stepId.value))
const relatedWords = computed(() => selectedStep.value ? wordsForStep(selectedStep.value.id, path.value, content) : [])
const scripts = computed(() => store.data.value.settings.language === 'ja' ? ['hiragana', 'katakana'] as const : ['hangul'] as const)
const all = computed(() => content.filter(item => item.script === script.value && item.kind === kind.value))
const groups = computed(() => [...new Set(all.value.map(item => item.group))])
const filtered = computed(() => all.value.filter(item => {
  const inStep = !selectedStep.value || selectedStep.value.items.some(candidate => candidate.id === item.id)
  return inStep && (group.value === 'Semua' || item.group === group.value)
    && (!search.value.trim() || `${item.glyph} ${item.answer} ${item.letterName || ''} ${item.meaning || ''}`.includes(search.value.toLowerCase().trim()))
}))
const status = (id: string) => itemProgress(id, store.data.value.sessions).status
const practiceLink = computed(() => ({ path: '/latihan', query: {
  script: script.value, group: selectedStep.value?.group || group.value, kind: kind.value,
  ...(selectedStep.value ? { items: selectedStep.value.items.map(item => item.id).join(',') } : {})
} }))
const wordPracticeLink = computed(() => ({ path: '/latihan', query: {
  script: script.value, kind: 'word', group: 'Semua', items: relatedWords.value.map(item => item.id).join(',')
} }))

watch([script, kind], () => { group.value = 'Semua'; stepId.value = kind.value === 'letter' ? path.value[0]?.id || '' : ''; search.value = '' }, { flush: 'sync' })
watch(() => store.data.value.settings.language, language => {
  if ((language === 'ko') !== (script.value === 'hangul')) script.value = language === 'ko' ? 'hangul' : 'hiragana'
})
watch(() => route.fullPath, () => {
  if (['hiragana', 'katakana', 'hangul'].includes(String(route.query.script))) script.value = route.query.script as Script
  kind.value = route.query.kind === 'word' ? 'word' : 'letter'
  group.value = groups.value.includes(String(route.query.group)) ? String(route.query.group) : 'Semua'
  stepId.value = kind.value !== 'letter' ? '' : path.value.some(step => step.id === route.query.step) ? String(route.query.step) : route.query.group ? '' : path.value[0]?.id || ''
  if (stepId.value) group.value = 'Semua'
  store.updateSettings({ language: script.value === 'hangul' ? 'ko' : 'ja' })
}, { immediate: true })
</script>

<template>
  <div>
    <div class="page-heading"><h1>Materi</h1><LanguageSwitch /></div>
    <div class="tabs" aria-label="Sistem tulisan"><button v-for="s in scripts" :key="s" :class="{ selected: script === s }" :aria-pressed="script === s" @click="script = s">{{ scriptLabels[s] }}</button></div>
    <div class="lesson-toolbar">
      <div v-if="kind === 'letter'" class="field"><label for="lesson">Pelajaran</label><select id="lesson" v-model="stepId" @change="group = 'Semua'"><option value="">{{ group === 'Semua' ? 'Semua huruf' : group }}</option><option v-for="(step, index) in path" :key="step.id" :value="step.id">{{ index + 1 }}. {{ step.title }}</option></select></div>
      <div v-else class="field"><label for="word-group">Kelompok</label><select id="word-group" v-model="group"><option>Semua</option><option v-for="g in groups" :key="g">{{ g }}</option></select></div>
      <div class="field"><label for="kind">Jenis</label><select id="kind" v-model="kind"><option value="letter">Huruf</option><option value="word">Kata</option></select></div>
    </div>
    <details class="disclosure material-filters">
      <summary>Cari & filter</summary>
      <div class="filter-row"><div class="field" style="flex:1"><label for="search">Cari</label><input id="search" v-model="search" placeholder="Huruf atau bacaan" type="search" @input="stepId = ''; group = 'Semua'"></div><div class="field"><label for="group">Kelompok</label><select id="group" v-model="group" @change="stepId = ''"><option>Semua</option><option v-for="g in groups" :key="g">{{ g }}</option></select></div><label class="check-label"><input v-model="hideAnswers" type="checkbox">Sembunyikan bacaan</label></div>
    </details>
    <div class="section-title"><h2>{{ selectedStep ? selectedStep.title : group === 'Semua' ? scriptLabels[script] : group }} <small class="muted">{{ filtered.length }} {{ kind === 'word' ? 'kata' : 'huruf' }}</small></h2><NuxtLink :to="practiceLink" class="button">Latih kelompok <AppIcon name="arrow" :size="15" /></NuxtLink></div>
    <div v-if="filtered.length" class="letter-grid">
      <NuxtLink v-for="item in filtered" :key="item.id" :to="`/materi/${encodeURIComponent(item.id)}`" :class="['letter-tile', { review: status(item.id) === 'Perlu diulang', fluent: status(item.id) === 'Lancar sementara' }]"><span class="letter-glyph" :lang="item.language">{{ item.glyph }}</span><span class="letter-reading">{{ hideAnswers ? '•••' : item.script === 'hangul' && item.kind === 'letter' ? `${item.prompt} → ${item.answer}` : item.answer }}</span><span v-if="item.letterName" class="letter-name">Nama: {{ hideAnswers ? '•••' : item.letterName }}</span><span v-if="status(item.id) !== 'Belum dilatih'" class="letter-status">{{ status(item.id) }}</span></NuxtLink>
    </div>
    <div v-else class="panel empty-state"><p>Tidak ada materi yang cocok.</p></div>
    <p v-if="selectedStep" class="field-help lesson-tip">Klik huruf untuk melihat kartu dan contoh.</p>
    <section v-if="selectedStep && relatedWords.length" class="step-words">
      <div class="section-title"><h2>Coba kata</h2><NuxtLink :to="wordPracticeLink" class="text-link">Latih {{ relatedWords.length }} kata terkait <AppIcon name="arrow" :size="14" /></NuxtLink></div>
      <div class="word-preview"><NuxtLink v-for="word in relatedWords.slice(0, 8)" :key="word.id" :to="`/materi/${encodeURIComponent(word.id)}`" class="word-chip" :lang="word.language">{{ word.glyph }}</NuxtLink></div>
    </section>
    <div v-if="selectedStep" class="lesson-navigation"><NuxtLink v-if="path.findIndex(step => step.id === stepId) > 0" :to="{ path: '/materi', query: { script, step: path[path.findIndex(step => step.id === stepId) - 1]?.id } }" class="text-link">← Sebelumnya</NuxtLink><NuxtLink v-if="path.findIndex(step => step.id === stepId) < path.length - 1" :to="{ path: '/materi', query: { script, step: path[path.findIndex(step => step.id === stepId) + 1]?.id } }" class="text-link">Berikutnya →</NuxtLink></div>
    <details v-if="script === 'hangul'" class="disclosure"><summary>Cara membaca Hangul</summary><p>Nama huruf berbeda dari bunyi blok. Contoh: ㄱ bernama giyeok, sedangkan 가 dibaca ga. Saat latihan, ketik bacaan bloknya.</p></details>
  </div>
</template>
