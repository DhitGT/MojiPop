<script setup lang="ts">
import type { Outcome } from '~/types/learning'
import { chronologicalAttempts, itemProgress, responseTime } from '~/utils/learning'
import { attemptMetrics } from '~/utils/analytics'

const props = defineProps<{ itemId: string }>()
const store = useLearningStore()
const sessions = computed(() => store.data.value.sessions)
const attempts = computed(() => chronologicalAttempts(sessions.value, props.itemId))
const progress = computed(() => itemProgress(props.itemId, sessions.value))
const metrics = computed(() => attemptMetrics(attempts.value))
const independent = computed(() => attempts.value.filter(attempt => !attempt.assisted))
const recentIndependent = computed(() => independent.value.slice(-10))
const recentCorrect = computed(() => recentIndependent.value.filter(attempt => attempt.outcome === 'correct').length)
const sessionCount = computed(() => new Set(attempts.value.map(attempt => attempt.sessionId)).size)
const independentSessions = computed(() => new Set(independent.value.map(attempt => attempt.sessionId)).size)
const recent = computed(() => attempts.value.slice(-10))
const correctTime = computed(() => attemptMetrics(attempts.value.filter(attempt => attempt.outcome === 'correct')).averageMs)
const formats = computed(() => (['typing', 'choice'] as const).map(format => attemptMetrics(sessions.value
  .filter(session => (session.config.answerFormat || 'typing') === format)
  .flatMap(session => session.attempts.filter(attempt => attempt.itemId === props.itemId)))))
const outcomes: { key: Outcome; label: string; symbol: string }[] = [
  { key: 'correct', label: 'Benar mandiri', symbol: '✓' },
  { key: 'wrong', label: 'Salah', symbol: '×' },
  { key: 'assisted', label: 'Dengan bantuan', symbol: '?' },
  { key: 'skipped', label: 'Dilewati', symbol: '–' }
]
const lastPractice = computed(() => {
  const last = attempts.value.at(-1)
  if (!last) return null
  const session = sessions.value.find(session => session.id === last.sessionId)
  const timestamp = last.answeredAt || session?.startedAt
  return timestamp ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp)) : null
})
const guidance = computed(() => {
  if (!attempts.value.length) return 'Mulai latihan pertama untuk mengetahui sejauh mana kamu mengingat materi ini.'
  if (!independent.value.length) return 'Kamu sudah mencoba dengan bantuan. Coba jawab mandiri untuk mulai mengukur progres.'
  if (progress.value.status === 'Perlu diulang') return 'Masih ada jawaban salah atau dilewati dalam 3 percobaan mandiri terakhir. Yuk, ulangi lagi.'
  if (progress.value.status === 'Lancar sementara') return 'Bacaan sudah konsisten. Ulangi secara berkala agar tetap ingat.'
  return 'Teruskan latihan mandiri di beberapa sesi untuk membangun ingatan yang konsisten.'
})
</script>

<template>
  <section class="item-progress" aria-label="Progres belajar materi ini">
    <p v-if="!store.ready.value" role="status">Memuat progres belajar…</p>
    <template v-else>
      <div class="progress-heading">
        <h2>Progres belajarmu</h2>
        <span class="learning-status" :class="{ fluent: progress.status === 'Lancar sementara', repeat: progress.status === 'Perlu diulang' }">{{ progress.status }}</span>
      </div>
      <p class="progress-guidance">{{ guidance }}</p>

      <dl class="item-metrics">
        <div><dt>Akurasi mandiri</dt><dd>{{ progress.total ? `${Math.round(progress.accuracy)}%` : '—' }}</dd></div>
        <div><dt>Total percobaan</dt><dd>{{ metrics.total }} <small>kali</small></dd></div>
        <div><dt>Sesi latihan</dt><dd>{{ sessionCount }} <small>sesi</small></dd></div>
        <div><dt>Rata-rata respons benar</dt><dd>{{ correctTime === null ? '—' : responseTime(correctTime) }}</dd></div>
      </dl>

      <div class="fluency-target">
        <h3>Menuju lancar sementara</h3>
        <div class="target-row"><span>Percobaan mandiri</span><strong>{{ Math.min(progress.total, 10) }} / 10</strong></div>
        <progress :value="Math.min(progress.total, 10)" max="10" aria-label="Percobaan mandiri menuju target 10" />
        <div class="target-row"><span>Sesi dengan jawaban mandiri</span><strong>{{ Math.min(independentSessions, 2) }} / 2</strong></div>
        <progress :value="Math.min(independentSessions, 2)" max="2" aria-label="Sesi mandiri menuju target 2" />
        <p>Target: minimal 9 benar dari 10 percobaan mandiri terakhir, tanpa salah atau lewati pada 3 terakhir.</p>
        <p v-if="recentIndependent.length"><strong>{{ recentCorrect }} / {{ recentIndependent.length }}</strong> benar pada percobaan mandiri terbaru.</p>
      </div>

      <div class="item-matrix">
        <h3>Matriks hasil latihan</h3>
        <table>
          <caption>Jumlah hasil per jenis jawaban</caption>
          <thead><tr><th scope="col">Hasil</th><th scope="col">Ketik</th><th scope="col">Pilihan ganda</th><th scope="col">Total</th></tr></thead>
          <tbody>
            <tr v-for="outcome in outcomes" :key="outcome.key">
              <th scope="row"><span class="outcome-symbol" :class="outcome.key" aria-hidden="true">{{ outcome.symbol }}</span>{{ outcome.label }}</th>
              <td>{{ formats[0]![outcome.key] }}</td><td>{{ formats[1]![outcome.key] }}</td><td>{{ metrics[outcome.key] }}</td>
            </tr>
          </tbody>
          <tfoot><tr><th scope="row">Total percobaan</th><td>{{ formats[0]!.total }}</td><td>{{ formats[1]!.total }}</td><td>{{ metrics.total }}</td></tr></tfoot>
        </table>
      </div>

      <div v-if="recent.length" class="recent-attempts">
        <h3>{{ recent.length }} jawaban terakhir <span>lama → baru</span></h3>
        <ol aria-label="Riwayat jawaban terbaru">
          <li v-for="(attempt, index) in recent" :key="attempt.id" :class="attempt.outcome" :aria-label="`${index + 1}. ${outcomes.find(outcome => outcome.key === attempt.outcome)?.label}, ${responseTime(attempt.responseMs)}`" :title="`${outcomes.find(outcome => outcome.key === attempt.outcome)?.label} · ${responseTime(attempt.responseMs)}`">{{ outcomes.find(outcome => outcome.key === attempt.outcome)?.symbol }}</li>
        </ol>
        <p v-if="lastPractice">Terakhir berlatih: {{ lastPractice }}</p>
      </div>
      <p class="progress-footnote">Akurasi mandiri tidak menghitung jawaban dengan bantuan. Progres tersimpan di browser ini.</p>
    </template>
  </section>
</template>

<style scoped>
.item-progress { min-width: 0; padding: 22px; border: 2px solid #ded9eb; border-radius: 18px; background: #fff; box-shadow: 0 4px 0 #e7e3ed; }
.progress-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.progress-heading h2 { font-size: 18px; margin: 0; }
.learning-status { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; background: #eee7ff; color: #5831a8; }
.learning-status.fluent { background: #e4f5cb; color: #3c6118; }
.learning-status.repeat { background: #ffedcf; color: #87520a; }
.item-progress .progress-guidance { margin: 12px 0 16px; color: #666079; font-size: 12px; line-height: 1.7; }
.item-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }
.item-metrics > div { display: flex; flex-direction: column; gap: 8px; padding: 13px; border: 1px solid #e8e2f2; background: #faf8ff; border-radius: 12px; }
.item-metrics dt { font-size: 11px; color: #69617b; }
.item-metrics dd { margin: 0; font-size: 24px; font-weight: 850; line-height: 1.2; color: #42277a; }
.item-metrics dd small { font-size: 11px; font-weight: 600; color: #69617b; }
.item-progress h3 { margin: 0 0 12px; font-size: 13px; }
.fluency-target, .item-matrix, .recent-attempts { margin-top: 20px; }
.target-row { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; }
progress { display: block; appearance: none; width: 100%; height: 7px; margin: 8px 0 12px; border: 0; border-radius: 10px; overflow: hidden; background: #eee9f6; }
progress::-webkit-progress-bar { background: #eee9f6; border-radius: 10px; }
progress::-webkit-progress-value { background: #8050e5; border-radius: 10px; }
progress::-moz-progress-bar { background: #8050e5; border-radius: 10px; }
.item-progress .fluency-target p, .item-progress .recent-attempts p, .item-progress .progress-footnote { font-size: 11px; line-height: 1.6; color: #70697e; margin: 8px 0 0; }
.item-matrix table { width: 100%; border-collapse: collapse; font-size: 11px; }
caption { text-align: left; color: #70697e; margin-bottom: 8px; font-size: 11px; }
.item-matrix th, .item-matrix td { padding: 10px 5px; border-bottom: 1px solid #eee9f4; text-align: right; white-space: normal; }
.item-matrix th:first-child { text-align: left; }
.item-matrix thead, .item-matrix tfoot { color: #5d4b7d; background: #faf8ff; }
.outcome-symbol { display: inline-grid; place-items: center; width: 19px; height: 19px; margin-right: 6px; border-radius: 5px; font-weight: 800; }
.correct { background: #e5f5cf; color: #3c641c; }
.wrong { background: #ffe1db; color: #a03d2d; }
.assisted { background: #fff0c8; color: #7c5a06; }
.skipped { background: #eeeaf5; color: #6a617c; }
.recent-attempts h3 { display: flex; justify-content: space-between; gap: 8px; }
.recent-attempts h3 span { font-size: 10px; font-weight: 500; color: #70697e; }
.recent-attempts ol { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 5px; list-style: none; padding: 0; margin: 0; }
.recent-attempts li { display: grid; place-items: center; border-radius: 6px; height: 30px; font-size: 15px; font-weight: 800; }
.item-progress .progress-footnote { border-top: 1px solid #eee9f4; padding-top: 12px; margin-top: 16px; }
@media (max-width: 680px) { .item-progress { padding: 16px; }.item-metrics dd { font-size: 22px; }.item-matrix th, .item-matrix td { padding-inline: 3px; }.outcome-symbol { margin-right: 4px; width: 16px; } }
</style>
