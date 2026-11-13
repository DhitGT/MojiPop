<script setup lang="ts">
import type { Session } from '~/types/learning'
import { contentById, modeLabels } from '~/data/content'
import { resultHistory, itemAnalytics, attemptMetrics } from '~/utils/analytics'
import { responseTime } from '~/utils/learning'
const props = defineProps<{ session: Session, sessions: Session[] }>()
const history = computed(() => resultHistory(props.session, props.sessions))
const rows = computed(() => itemAnalytics(history.value))
const sessionMetrics = computed(() => attemptMetrics(props.session.attempts))
const totals = computed(() => attemptMetrics(history.value.flatMap(s => s.attempts)))
const search = ref('')
const scope = ref('session')
const sort = ref('difficulty')
const selected = ref('')
const currentIds = computed(() => new Set(props.session.attempts.map(a => a.itemId)))
const visible = computed(() => rows.value.filter(row => (scope.value === 'all' || currentIds.value.has(row.itemId)) &&
  `${contentById[row.itemId]?.prompt} ${contentById[row.itemId]?.answer} ${contentById[row.itemId]?.group}`.toLowerCase().includes(search.value.toLowerCase().trim()))
  .sort((a, b) => sort.value === 'time' ? (b.averageMs || 0) - (a.averageMs || 0) : sort.value === 'wrong' ? b.wrong - a.wrong : b.difficulty - a.difficulty))
const detail = computed(() => rows.value.find(r => r.itemId === selected.value))
const selectedHistory = computed(() => detail.value?.attempts || [])
const labels = computed(() => props.session.attempts.map((_, i) => `Soal ${i + 1}`))
const progress = computed(() => {
  let correct = 0, total = 0
  return history.value.map(s => {
    const m = attemptMetrics(s.attempts)
    total += m.total; correct += m.correct
    return { session: s, accuracy: correct / total * 100, sessionAccuracy: m.accuracy, average: (m.averageMs || 0) / 1000 }
  })
})
const outcomeLabel = { correct: 'Benar mandiri', wrong: 'Salah', assisted: 'Dibantu', skipped: 'Dilewati' }
const priority = computed(() => rows.value.filter(r => currentIds.value.has(r.itemId) && (r.wrong || r.assisted || r.skipped || r.difficulty >= 10)).slice(0, 3))
</script>

<template>
  <section class="practice-analytics" aria-label="Analisis detail latihan">
    <div><h2>Rangkuman & matriks latihan</h2><p class="analytics-caption">Akumulasi hingga hasil ini · {{ history.length }} sesi · {{ session.config.answerFormat === 'choice' ? 'Pilihan ganda' : 'Ketik' }} · {{ totals.total }} jawaban. Tulisan, jenis materi, format jawaban, dan versi materi yang sama.</p></div>
    <div v-if="!session.attempts.length" class="notice">Belum ada jawaban pada sesi ini. Jawab soal untuk melihat analisis waktu dan kesulitan.</div>
    <div class="analytics-metrics">
      <div class="panel"><strong>{{ responseTime(sessionMetrics.averageMs) }}</strong><span>Rata-rata respons sesi</span></div>
      <div class="panel"><strong>{{ responseTime(sessionMetrics.medianMs) }}</strong><span>Median semua respons sesi</span></div>
      <div class="panel"><strong>{{ totals.accuracy.toFixed(1) }}%</strong><span>Akurasi mandiri akumulatif</span></div>
      <div class="panel"><strong>{{ rows.filter(r => r.wrong >= 2).length }}</strong><span>Materi dengan salah berulang</span></div>
    </div>
    <div v-if="priority.length" class="panel analytics-priority"><h3>Fokus latihan berikutnya</h3><ul><li v-for="row in priority" :key="row.itemId"><strong>{{ contentById[row.itemId]?.prompt }} ({{ contentById[row.itemId]?.answer }})</strong> — {{ row.signals.join('; ') }}. <button class="text-link" @click="selected = row.itemId">Lihat pola</button></li></ul><NuxtLink :to="{ path: '/latihan', query: { script: session.config.script, kind: session.config.kind, format: session.config.answerFormat || 'typing', items: priority.map(r => r.itemId).join(',') } }" class="button secondary">Latih materi tersulit</NuxtLink></div>
    <div class="analytics-chart-grid">
      <ResultLineChart title="Waktu respons tiap soal" :values="session.attempts.map(a => a.responseMs / 1000)" :labels="labels" unit="dtk" description="Semua jawaban pada sesi ini, termasuk salah, dibantu, dan dilewati." />
      <ResultLineChart title="Akurasi akumulatif lintas sesi" :values="progress.map(p => p.accuracy)" :labels="progress.map((_, i) => `Sesi ${i + 1}`)" unit="%" percent description="Benar mandiri dibagi seluruh jawaban sejak sesi pertama." />
      <ResultLineChart title="Akurasi setiap sesi" :values="progress.map(p => p.sessionAccuracy)" :labels="progress.map((_, i) => `Sesi ${i + 1}`)" unit="%" percent description="Lihat naik turunnya akurasi mandiri per sesi; komposisi materi dapat berbeda." />
      <ResultLineChart title="Rata-rata waktu lintas sesi" :values="progress.map(p => p.average)" :labels="progress.map((_, i) => `Sesi ${i + 1}`)" unit="dtk" description="Waktu rata-rata setiap sesi. Mode, perangkat, dan materi dapat berbeda." />
    </div>
    <section class="panel analytics-matrix"><h3>Matriks per {{ session.config.kind === 'word' ? 'kata' : 'huruf' }}</h3><p class="analytics-caption">Angka per materi adalah akumulasi hingga sesi ini. Klik Detail untuk melihat jejak jawabannya.</p>
      <div class="analytics-controls">
        <div class="field"><label for="analytics-scope">Cakupan materi</label><select id="analytics-scope" v-model="scope"><option value="session">Materi sesi ini</option><option value="all">Semua yang pernah dilatih</option></select></div>
        <div class="field"><label for="analytics-search">Cari huruf / bacaan</label><input id="analytics-search" v-model="search" type="search" placeholder="Contoh: a" /></div>
        <div class="field"><label for="analytics-sort">Urutkan</label><select id="analytics-sort" v-model="sort"><option value="difficulty">Paling sulit</option><option value="wrong">Paling sering salah</option><option value="time">Respons terlama</option></select></div>
      </div>
      <div class="table-wrap" role="region" aria-label="Matriks hasil per materi, geser untuk kolom lainnya" tabindex="0"><table><thead><tr><th>Materi / bacaan</th><th>Sesi ini</th><th>Total / sesi</th><th>Benar</th><th>Salah</th><th>Bantuan / lewati</th><th>Akurasi</th><th>Rata-rata / median</th><th>Tercepat / terlambat</th><th>Sulit / 100</th><th>Pola kesulitan</th><th>Jejak</th></tr></thead><tbody><tr v-for="row in visible" :key="row.itemId"><td><strong class="analytics-glyph">{{ contentById[row.itemId]?.prompt }}</strong><span>{{ contentById[row.itemId]?.answer }}</span></td><td>{{ session.attempts.filter(a => a.itemId === row.itemId).length }} soal</td><td>{{ row.total }} / {{ row.sessionCount }}</td><td>{{ row.correct }}</td><td>{{ row.wrong }}</td><td>{{ row.assisted }} / {{ row.skipped }}</td><td>{{ row.accuracy.toFixed(1) }}%</td><td>{{ responseTime(row.averageMs) }} / {{ responseTime(row.medianMs) }}</td><td>{{ responseTime(row.fastestMs) }} / {{ responseTime(row.slowestMs) }}</td><td><strong>{{ row.difficulty }}</strong><span class="difficulty-track"><i :style="{ width: `${row.difficulty}%` }" /></span>{{ row.level }}</td><td class="analytics-pattern">{{ row.signals.join('; ') }}<small v-if="row.total < 5">{{ row.total }}/5 percobaan: pola masih sementara.</small></td><td><button class="text-link" :aria-label="`Detail ${contentById[row.itemId]?.prompt}`" :aria-pressed="selected === row.itemId" @click="selected = row.itemId">Detail</button></td></tr></tbody></table></div>
      <p v-if="!visible.length" role="status">Belum ada materi yang cocok.</p>
    </section>
    <section v-if="detail" class="panel analytics-detail" aria-live="polite"><h3>Detail {{ contentById[detail.itemId]?.prompt }} · {{ contentById[detail.itemId]?.answer }}</h3><p>{{ detail.signals.join('; ') }}.</p><p>Akurasi 10 percobaan terakhir: {{ detail.recentAccuracy.toFixed(1) }}% ({{ Math.min(10, detail.total) }} jawaban). Rangkaian salah terpanjang: {{ detail.longestErrorStreak }}.</p><p v-if="detail.commonErrors.length">Jawaban keliru yang muncul: {{ detail.commonErrors.map(e => `“${e.input || '(kosong)'}” ${e.count}×`).join(', ') }}. Termasuk jawaban belum tepat saat dibantu.</p>
      <ResultLineChart title="Jejak waktu materi ini" :values="selectedHistory.map(a => a.responseMs / 1000)" :labels="selectedHistory.map((_, i) => `Percobaan ${i + 1}`)" unit="dtk" description="Urutan percobaan pada seluruh sesi yang tercakup." />
      <div class="table-wrap" tabindex="0" role="region" aria-label="Riwayat jawaban materi"><table><thead><tr><th>#</th><th>Sesi / mode</th><th>Jawabanmu</th><th>Hasil</th><th>Respons</th></tr></thead><tbody><tr v-for="(a, i) in selectedHistory" :key="a.id"><td>{{ i + 1 }}</td><td><NuxtLink :to="`/hasil/${a.sessionId}`" class="text-link">Sesi {{ history.findIndex(s => s.id === a.sessionId) + 1 }}</NuxtLink> · {{ modeLabels[history.find(s => s.id === a.sessionId)!.config.mode] }}</td><td>{{ a.input || '—' }}</td><td>{{ outcomeLabel[a.outcome] }}{{ a.outcome === 'assisted' ? a.accepted ? ' · tepat' : ' · belum tepat' : '' }}</td><td>{{ responseTime(a.responseMs) }}</td></tr></tbody></table></div>
      <NuxtLink :to="`/materi/${encodeURIComponent(detail.itemId)}`" class="text-link">Pelajari kartu materi</NuxtLink>
    </section>
    <details class="disclosure"><summary>Cara membaca analisis</summary><p>Skor sulit 0–100 = 80 × proporsi jawaban yang belum benar mandiri + maksimal 20 poin kelambatan. Poin waktu = 20 × (rata-rata respons benar materi ÷ rata-rata respons benar pribadi − 1), dibatasi 0–20. Waktu cepat pada jawaban salah tidak mengurangi skor.</p><p>Minimal 5 percobaan untuk label: skor ≥60 Sulit, ≥30 Perlu latihan, di bawahnya Relatif lancar. Di bawah 5 percobaan ditandai Data awal. Skor adalah indikator latihan, bukan penilaian kemampuan tetap.</p><p>Rata-rata, median, tercepat, dan terlambat mencakup semua respons. Salah berulang berarti minimal 2 jawaban berstatus salah. Bantuan dan lewati ditampilkan terpisah. Pola jawaban keliru tidak otomatis berarti huruf tertukar.</p><p>Riwayat berasal dari progres di browser ini, termasuk sesi yang disimpan belum selesai. Hasil lama tidak memasukkan jawaban setelah sesi tersebut. Cadangan lama tanpa waktu jawaban memakai waktu mulai sesi. Mode dan perangkat berbeda bisa memengaruhi waktu; grafik ini bukan perbandingan rekor.</p></details>
  </section>
</template>

<style scoped>
.practice-analytics { display: grid; gap: 20px; margin-block: 24px; min-width: 0; }
.practice-analytics h2 { font-size: 1.3rem; }.practice-analytics h3 { font-size: 1rem; margin-bottom: 10px; }
.analytics-caption, .analytics-detail p { font-size: .82rem; line-height: 1.7; color: var(--muted); margin-block: 8px; }
.analytics-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.analytics-metrics .panel { padding: 18px; }.analytics-metrics strong { display: block; font-size: 1.25rem; color: var(--accent); }.analytics-metrics span { display: block; font-size: .75rem; margin-top: 6px; color: var(--muted); }
.analytics-priority ul { padding-left: 20px; font-size: .85rem; line-height: 1.8; margin-bottom: 18px; }.analytics-priority li + li { margin-top: 10px; }
.analytics-chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.analytics-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-block: 18px; }.analytics-controls input, .analytics-controls select { width: 100%; min-width: 0; }
.analytics-matrix, .analytics-detail { min-width: 0; }.analytics-matrix table { min-width: 1150px; }.analytics-matrix td { vertical-align: top; }.analytics-glyph { display: block; font-size: 25px; color: var(--ink); }.analytics-pattern { min-width: 180px; }.analytics-pattern small { display: block; margin-top: 6px; }.difficulty-track { display: block; height: 5px; background: #e5def1; border-radius: 9px; width: 85px; margin-block: 7px; }.difficulty-track i { display: block; height: 100%; background: #a54429; border-radius: inherit; }
@media (max-width: 680px) { .analytics-controls, .analytics-chart-grid { grid-template-columns: 1fr; }.analytics-metrics .panel { padding: 14px; }.analytics-metrics strong { font-size: 1.05rem; } }
</style>
