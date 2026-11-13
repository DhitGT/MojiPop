<script setup lang="ts">
import type { Script, Kind } from '~/types/learning'
import { content, scriptLabels } from '~/data/content'
import { itemProgress } from '~/utils/learning'
import { studyPath, wordsForStep } from '~/utils/curriculum'

const store = useLearningStore()
const route = useRoute()
const script = ref<Script>(store.data.value.settings.language === 'ja' ? 'hiragana' : 'hangul')
const kind = ref<Kind>('letter')
const group = ref('Semua')
const stepId = ref('')
const hideAnswers = ref(false)
const view = ref<'lesson' | 'table'>('lesson')
const showTable = computed(() => kind.value === 'letter' && view.value === 'table')
const search = ref('')
const path = computed(() => studyPath(script.value, content))
const selectedStep = computed(() => showTable.value ? undefined : path.value.find(step => step.id === stepId.value))
const relatedWords = computed(() => selectedStep.value ? wordsForStep(selectedStep.value.id, path.value, content) : [])
const scripts = computed(() => store.data.value.settings.language === 'ja' ? ['hiragana', 'katakana'] as const : ['hangul'] as const)
const all = computed(() => content.filter(item => item.script === script.value && item.kind === kind.value))
const groups = computed(() => [...new Set(all.value.map(item => item.group))])
const letterGroups = computed(() => groups.value.map(name => ({ name, items: all.value.filter(item => item.group === name) })))
const filtered = computed(() => all.value.filter(item => {
  if (showTable.value) return true
  const inStep = !selectedStep.value || selectedStep.value.items.some(candidate => candidate.id === item.id)
  return inStep && (group.value === 'Semua' || item.group === group.value)
    && (!search.value.trim() || `${item.glyph} ${item.answer} ${item.letterName || ''} ${item.meaning || ''}`.includes(search.value.toLowerCase().trim()))
}))
const visibleGroups = computed(() => groups.value.map(name => ({
  name, items: filtered.value.filter(item => item.group === name)
})).filter(group => group.items.length))
const groupPracticeLink = (name: string) => ({ path: '/latihan', query: {
  script: script.value, kind: kind.value, group: name,
  items: filtered.value.filter(item => item.group === name).map(item => item.id).join(',')
} })
const status = (id: string) => itemProgress(id, store.data.value.sessions).status
const practiceLink = computed(() => ({ path: '/latihan', query: {
  script: script.value, group: showTable.value ? 'Semua' : selectedStep.value?.group || group.value, kind: kind.value,
  ...(selectedStep.value ? { items: selectedStep.value.items.map(item => item.id).join(',') } : {})
} }))
const wordPracticeLink = computed(() => ({ path: '/latihan', query: {
  script: script.value, kind: 'word', group: 'Semua', items: relatedWords.value.map(item => item.id).join(',')
} }))

watch([script, kind], () => { group.value = 'Semua'; stepId.value = ''; search.value = '' }, { flush: 'sync' })
watch(() => store.data.value.settings.language, language => {
  if ((language === 'ko') !== (script.value === 'hangul')) script.value = language === 'ko' ? 'hangul' : 'hiragana'
})
watch(() => route.fullPath, () => {
  if (['hiragana', 'katakana', 'hangul'].includes(String(route.query.script))) script.value = route.query.script as Script
  kind.value = route.query.kind === 'word' ? 'word' : 'letter'
  group.value = groups.value.includes(String(route.query.group)) ? String(route.query.group) : 'Semua'
  stepId.value = kind.value === 'letter' && path.value.some(step => step.id === route.query.step) ? String(route.query.step) : ''
  if (stepId.value) group.value = 'Semua'
  store.updateSettings({ language: script.value === 'hangul' ? 'ko' : 'ja' })
}, { immediate: true })
</script>

<template>
  <div>
    <div class="page-heading"><h1>Materi</h1><LanguageSwitch /></div>
    <div class="tabs" aria-label="Sistem tulisan"><button v-for="s in scripts" :key="s" :class="{ selected: script === s }" :aria-pressed="script === s" @click="script = s">{{ scriptLabels[s] }}</button></div>
    <div v-if="kind === 'letter'" class="tabs" role="group" aria-label="Tampilan materi"><button :class="{ selected: !showTable }" :aria-pressed="!showTable" @click="view = 'lesson'">Per kelompok</button><button :class="{ selected: showTable }" :aria-pressed="showTable" @click="view = 'table'">Tabel semua huruf</button></div>
    <div class="lesson-toolbar">
      <div v-if="showTable" class="field"><label class="check-label"><input v-model="hideAnswers" type="checkbox">Sembunyikan bacaan</label></div>
      <div v-else-if="kind === 'letter'" class="field"><label for="lesson">Pelajaran</label><select id="lesson" v-model="stepId" @change="group = 'Semua'"><option value="">{{ group === 'Semua' ? 'Semua huruf' : group }}</option><option v-for="(step, index) in path" :key="step.id" :value="step.id">{{ index + 1 }}. {{ step.title }}</option></select></div>
      <div v-else class="field"><label for="word-group">Kelompok</label><select id="word-group" v-model="group"><option>Semua</option><option v-for="g in groups" :key="g">{{ g }}</option></select></div>
      <div class="field"><label for="kind">Jenis</label><select id="kind" v-model="kind"><option value="letter">Huruf</option><option value="word">Kata</option></select></div>
    </div>
    <details v-if="!showTable" class="disclosure material-filters">
      <summary>Cari & filter</summary>
      <div class="filter-row"><div class="field" style="flex:1"><label for="search">Cari</label><input id="search" v-model="search" placeholder="Huruf atau bacaan" type="search" @input="stepId = ''; group = 'Semua'"></div><div class="field"><label for="group">Kelompok</label><select id="group" v-model="group" @change="stepId = ''"><option>Semua</option><option v-for="g in groups" :key="g">{{ g }}</option></select></div><label class="check-label"><input v-model="hideAnswers" type="checkbox">Sembunyikan bacaan</label></div>
    </details>
    <div class="section-title"><h2>{{ showTable ? `Tabel ${scriptLabels[script]}` : selectedStep ? selectedStep.title : group === 'Semua' ? scriptLabels[script] : group }} <small class="muted">{{ filtered.length }} {{ kind === 'word' ? 'kata' : 'huruf' }}</small></h2><NuxtLink v-if="filtered.length" :to="practiceLink" class="button">{{ showTable || (!selectedStep && group === 'Semua') ? 'Latih semua' : 'Latih kelompok' }} <AppIcon name="arrow" :size="15" /></NuxtLink></div>
    <template v-if="showTable">
      <p class="field-help">Semua huruf {{ scriptLabels[script] }} dan bacaannya. Klik huruf untuk membuka kartu detail.</p>
      <div class="letter-chart-wrap">
        <table class="letter-chart">
          <caption class="sr-only">Tabel semua huruf {{ scriptLabels[script] }}</caption>
          <thead><tr><th scope="col">Kelompok</th><th scope="col">Huruf & bacaan</th></tr></thead>
          <tbody><tr v-for="row in letterGroups" :key="row.name">
            <th scope="row">{{ row.name }}</th>
            <td><div class="letter-chart-items"><NuxtLink v-for="item in row.items" :key="item.id" :to="`/materi/${encodeURIComponent(item.id)}`" class="letter-chart-item">
              <span class="letter-glyph" :lang="item.language">{{ item.glyph }}</span>
              <span class="letter-reading">{{ hideAnswers ? '•••' : item.script === 'hangul' ? `${item.prompt} → ${item.answer}` : item.answer }}</span>
              <span v-if="item.letterName" class="letter-name">{{ hideAnswers ? '•••' : item.letterName }}</span>
            </NuxtLink></div></td>
          </tr></tbody>
        </table>
      </div>
    </template>
    <div v-else-if="filtered.length" class="material-groups">
      <section v-for="(row, index) in visibleGroups" :key="row.name" :aria-labelledby="`material-group-${index}`">
        <div v-if="!selectedStep && group === 'Semua'" class="section-title">
          <h2 :id="`material-group-${index}`">{{ row.name }} <small class="muted">{{ row.items.length }} {{ kind === 'word' ? 'kata' : 'huruf' }}</small></h2>
          <NuxtLink :to="groupPracticeLink(row.name)" class="button">Latih kelompok <AppIcon name="arrow" :size="15" /></NuxtLink>
        </div>
        <h3 v-else :id="`material-group-${index}`" class="sr-only">{{ row.name }}</h3>
        <div class="letter-grid">
          <NuxtLink v-for="item in row.items" :key="item.id" :to="`/materi/${encodeURIComponent(item.id)}`" :class="['letter-tile', { review: status(item.id) === 'Perlu diulang', fluent: status(item.id) === 'Lancar sementara' }]"><span class="letter-glyph" :lang="item.language">{{ item.glyph }}</span><span class="letter-reading">{{ hideAnswers ? '•••' : item.script === 'hangul' && item.kind === 'letter' ? `${item.prompt} → ${item.answer}` : item.answer }}</span><span v-if="item.letterName" class="letter-name">Nama: {{ hideAnswers ? '•••' : item.letterName }}</span><span v-if="status(item.id) !== 'Belum dilatih'" class="letter-status">{{ status(item.id) }}</span></NuxtLink>
        </div>
      </section>
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

<style scoped>
.material-groups { display: grid; gap: 24px; }
.material-groups .section-title { margin-top: 0; }
.letter-tile .letter-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 5px 10px;
  border: 1px solid #c9b6e3;
  border-radius: 999px;
  background: #f3ecfc;
  color: #59397b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}
.letter-tile.fluent .letter-status {
  border-color: #a6bf6b;
  background: #edf7d6;
  color: #3c541c;
}
.letter-tile.review .letter-status {
  border-color: #df9b8c;
  background: #fff0eb;
  color: #933c2b;
}
</style>
