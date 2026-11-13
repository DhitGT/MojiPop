<script setup lang="ts">
import { content, contentById, confusionGroups, scriptLabels, modeLabels } from '~/data/content'
import { summarize, detectConfusion, duration, responseTime, isNewRecord, comparisonKey } from '~/utils/learning'
const route = useRoute()
const store = useLearningStore()
const session = computed(() => store.data.value.sessions.find(session => session.id === String(route.params.id)))
const summary = computed(() => session.value ? summarize(session.value) : null)
const record = computed(() => session.value && isNewRecord(session.value, store.data.value.sessions))
const mistakes = computed(() => {
  if (!session.value) return []
  const ids = [...new Set(session.value.attempts.filter(attempt => attempt.outcome === 'wrong' || attempt.outcome === 'skipped').map(attempt => attempt.itemId))]
  return ids.map(id => ({
    item: contentById[id]!, total: session.value!.attempts.filter(attempt => attempt.itemId === id).length,
    wrong: session.value!.attempts.filter(attempt => attempt.itemId === id && ['wrong', 'skipped'].includes(attempt.outcome)).length
  })).sort((a, b) => b.wrong - a.wrong)
})
const pairs = computed(() => [...new Set(session.value?.attempts.map(attempt => detectConfusion(attempt, content, confusionGroups)).filter(group => group !== null) || [])])
const previous = computed(() => session.value && [...store.data.value.sessions].reverse().find(other => other.id !== session.value!.id && other.status === 'completed' && other.startedAt < session.value!.startedAt && comparisonKey(other) === comparisonKey(session.value!)))
const outcomeLabels = { correct: '✓ Benar', wrong: '× Salah', assisted: '◇ Dibantu', skipped: '→ Lewati' }
</script>

<template>
  <div v-if="session && summary" class="results-simple">
    <div class="results-hero"><MimiMascot :celebrate="session.status === 'completed'" class="result-mascot" /><h1>{{ session.status === 'completed' ? 'Sesi selesai' : 'Sesi disimpan' }}</h1><p>{{ scriptLabels[session.config.script] }} · {{ modeLabels[session.config.mode] }}</p><span v-if="record" class="pill green">✦ Rekor baru</span></div>
    <div class="metric-grid"><div class="panel metric"><strong>{{ Math.round(summary.accuracy) }}%</strong><span>Akurasi mandiri</span></div><div class="panel metric"><strong>{{ duration(session.activeMs) }}</strong><span>Waktu</span></div></div>
    <div class="count-row"><span>✓ {{ summary.correct }} benar mandiri</span><span>× {{ summary.wrong }} salah</span><span v-if="summary.assisted">◇ {{ summary.assisted }} dibantu</span><span v-if="summary.skipped">→ {{ summary.skipped }} lewati</span><span v-if="session.unfinished">◌ {{ session.unfinished }} tidak selesai</span></div>
    <div class="button-row results-actions"><NuxtLink v-if="mistakes.length" :to="`/latihan?retry=${session.id}`" class="button"><AppIcon name="repeat" :size="16" /> Ulang kesalahan</NuxtLink><NuxtLink v-else to="/materi" class="button">Lanjut belajar <AppIcon name="arrow" :size="16" /></NuxtLink><NuxtLink :to="`/latihan?repeat=${session.id}`" class="button secondary">Ulang paket</NuxtLink></div>
    <SessionCharts :session="session" />
    <PracticeAnalytics :session="session" :sessions="store.data.value.sessions" />
    <section v-if="mistakes.length" class="panel"><h2>Perlu diulang</h2><div class="table-wrap"><table><thead><tr><th>Soal</th><th>Bacaan</th><th>Salah / lewati</th><th /></tr></thead><tbody><tr v-for="mistake in mistakes" :key="mistake.item.id"><td class="glyph-cell">{{ mistake.item.prompt }}</td><td>{{ mistake.item.answer }}</td><td>{{ mistake.wrong }} / {{ mistake.total }}</td><td><NuxtLink :to="`/materi/${encodeURIComponent(mistake.item.id)}`" class="text-link">Lihat kartu</NuxtLink></td></tr></tbody></table></div></section>
    <section v-if="pairs.length" class="result-pairs"><h2>Mungkin tertukar?</h2><div v-for="pair in pairs" :key="pair.ids.join()" class="notice"><NuxtLink :to="{ path: '/latihan', query: { script: session.config.script, kind: 'letter', pair: pair.ids.join(',') } }" class="text-link">Latih {{ pair.ids.map(id => contentById[id]?.glyph).join(' dan ') }} →</NuxtLink></div></section>
    <details class="disclosure answer-details"><summary>Lihat semua jawaban ({{ summary.total }})</summary><div v-if="session.attempts.length" class="table-wrap"><table><thead><tr><th>#</th><th>Soal</th><th>Jawabanmu</th><th>Bacaan</th><th>Hasil</th><th>Respons</th></tr></thead><tbody><tr v-for="attempt in session.attempts" :key="attempt.id"><td>{{ attempt.order + 1 }}</td><td class="glyph-cell">{{ contentById[attempt.itemId]?.prompt }}</td><td>{{ attempt.input || '—' }}</td><td>{{ contentById[attempt.itemId]?.answer }}</td><td>{{ outcomeLabels[attempt.outcome] }}{{ attempt.outcome === 'assisted' ? attempt.accepted ? ' · tepat' : ' · belum tepat' : '' }}</td><td>{{ responseTime(attempt.responseMs) }}</td></tr></tbody></table></div><p v-else>Belum ada jawaban.</p></details>
    <details class="disclosure"><summary>Detail skor</summary><p v-if="session.hasPaused">Sesi pernah dijeda. Tidak masuk rekor kecepatan.</p><p v-if="session.status !== 'completed'">Sesi belum mencapai target.</p><p>Median respons benar: {{ responseTime(summary.medianMs) }}.</p><p v-if="previous">Akurasi sesi sebelumnya: {{ Math.round(summarize(previous).accuracy) }}%. {{ session.config.source === 'benchmark' ? 'Paket tetap.' : 'Soal acak dapat berbeda.' }}</p><p>Akurasi mandiri = benar tanpa bantuan ÷ semua jawaban. Jawaban dibantu dan dilewati tetap dihitung dalam total. Waktu respons juga dipengaruhi kemampuan mengetik.</p></details>
    <NuxtLink to="/materi" class="text-link">Pilih materi lain</NuxtLink>
  </div>
  <div v-else class="panel empty-state"><h1>Hasil tidak ditemukan</h1><NuxtLink to="/latihan" class="button">Mulai latihan</NuxtLink></div>
</template>
