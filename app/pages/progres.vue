<script setup lang="ts">
import { content, scriptLabels, modeLabels } from '~/data/content'
import { itemProgress, summarize, duration, isNewRecord } from '~/utils/learning'
const store = useLearningStore()
const achievements = useAchievements()
const language = computed(() => store.data.value.settings.language)
const sessions = computed(() => store.data.value.sessions.filter(session => session.config.language === language.value))
const items = computed(() => content.filter(item => item.language === language.value).map(item => ({ item, ...itemProgress(item.id, sessions.value) })).filter(item => item.total > 0))
const filter = ref('Semua')
const kind = ref('letter')
const filtered = computed(() => items.value.filter(item => item.item.kind === kind.value && (filter.value === 'Semua' || item.status === filter.value)).sort((a, b) => a.accuracy - b.accuracy))
const completed = computed(() => sessions.value.filter(session => session.status === 'completed'))
const overall = computed(() => {
  const attempts = sessions.value.flatMap(session => session.attempts)
  return attempts.length ? Math.round(attempts.filter(attempt => attempt.outcome === 'correct').length / attempts.length * 100) : null
})
const date = (value: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
</script>

<template>
  <div>
    <div class="page-heading"><h1>Progres</h1><LanguageSwitch /></div>
    <ActivityCalendar :sessions="sessions" />
    <div class="section-title"><div><h2>Achievement</h2><p>{{ achievements.unlocked }} pencapaian diraih</p></div><NuxtLink to="/achievement" class="button secondary">Lihat koleksi <AppIcon name="trophy" :size="16" /></NuxtLink></div>
    <div v-if="!sessions.length" class="panel empty-state"><h2>Belum ada latihan</h2><NuxtLink to="/latihan" class="button">Mulai latihan</NuxtLink></div>
    <template v-else>
      <div class="metric-grid"><div class="panel metric"><strong>{{ completed.length }}</strong><span>Sesi selesai</span></div><div class="panel metric"><strong>{{ overall === null ? '—' : `${overall}%` }}</strong><span>Akurasi mandiri</span></div><div class="panel metric"><strong>{{ items.filter(item => item.status === 'Lancar sementara').length }}</strong><span>Lancar sementara</span></div></div>
      <ProgressFocus :sessions="sessions" />
      <div class="section-title"><h2>Materi yang dilatih</h2></div>
      <div class="filter-row"><div class="field"><label for="progress-kind">Jenis</label><select id="progress-kind" v-model="kind"><option value="letter">Huruf</option><option value="word">Kata</option></select></div><div class="field"><label for="progress-filter">Status</label><select id="progress-filter" v-model="filter"><option>Semua</option><option>Sedang dilatih</option><option>Perlu diulang</option><option>Lancar sementara</option></select></div></div>
      <section class="panel"><div v-if="filtered.length" class="table-wrap"><table><thead><tr><th>Materi</th><th>Bacaan</th><th>Benar / total</th><th>Akurasi</th><th>Status</th></tr></thead><tbody><tr v-for="entry in filtered" :key="entry.item.id"><td class="glyph-cell"><NuxtLink :to="`/materi/${encodeURIComponent(entry.item.id)}`">{{ entry.item.glyph }}</NuxtLink></td><td>{{ entry.item.answer }}</td><td>{{ entry.correct }} / {{ entry.total }}</td><td>{{ Math.round(entry.accuracy) }}%</td><td><span :class="['pill', { orange: entry.status === 'Perlu diulang', green: entry.status === 'Lancar sementara' }]">{{ entry.status }}</span></td></tr></tbody></table></div><p v-else class="field-help">Tidak ada materi yang cocok.</p></section>
      <div class="section-title"><h2>Riwayat</h2></div>
      <section class="panel table-wrap"><table><thead><tr><th>Waktu</th><th>Latihan</th><th>Akurasi</th><th>Status</th></tr></thead><tbody><tr v-for="session in [...sessions].reverse()" :key="session.id"><td><NuxtLink :to="`/hasil/${session.id}`" class="text-link">{{ date(session.startedAt) }} ↗</NuxtLink></td><td>{{ scriptLabels[session.config.script] }} · {{ modeLabels[session.config.mode] }}<br><small>{{ duration(session.activeMs) }}</small></td><td>{{ Math.round(summarize(session).accuracy) }}%</td><td><span class="pill">{{ session.status === 'completed' ? isNewRecord(session, sessions) ? '✦ Rekor' : 'Selesai' : 'Belum selesai' }}</span><NuxtLink v-if="session.status !== 'completed'" :to="`/arena?id=${session.id}`" class="text-link">Lanjut →</NuxtLink></td></tr></tbody></table></section>
      <details class="disclosure"><summary>Arti status belajar</summary><p>Perlu diulang: ada salah atau lewati pada tiga percobaan terakhir. Lancar sementara: minimal 10 percobaan mandiri di dua sesi, dengan minimal 9 dari 10 terakhir benar. Selain itu: sedang dilatih. Jawaban dibantu tidak menaikkan status.</p></details>
    </template>
  </div>
</template>
