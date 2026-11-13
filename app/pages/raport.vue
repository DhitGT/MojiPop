<script setup lang="ts">
import { contentById, scriptLabels } from '~/data/content'
import { learningReport, type ReportPeriod } from '~/utils/report'
import { dailyActivity, localDateKey } from '~/utils/activity'
import { reviewSummary } from '~/utils/analytics'

const store = useLearningStore()
const period = ref<ReportPeriod>('30')
const now = ref(new Date())
const language = computed(() => store.data.value.settings.language)
const report = computed(() => learningReport(store.data.value.sessions, language.value, period.value, now.value))
const periods = [{ value: '7', label: '7 hari' }, { value: '30', label: '30 hari' }, { value: 'all', label: 'Semua waktu' }] as const
const periodLabel = computed(() => periods.find(option => option.value === period.value)!.label)
const percent = (value: number | null) => value === null ? '—' : `${Math.round(value)}%`
const gradeCopy = computed(() => ({ A: 'Sangat baik', B: 'Sudah baik', C: 'Terus berkembang', D: 'Perlu penguatan' })[report.value.grade || ''] || 'Data awal')
const focus = computed(() => reviewSummary(report.value.sessions).flatMap(row => {
  const item = contentById[row.itemId]
  return item ? [{ ...row, item }] : []
}).slice(0, 3))
const days = computed(() => {
  const activity = dailyActivity(report.value.sessions)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.value)
    date.setDate(date.getDate() - 6 + index)
    const key = localDateKey(date)
    return { key, label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date),
      date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date), total: activity.get(key)?.total || 0 }
  })
})
const maxDaily = computed(() => Math.max(1, ...days.value.map(day => day.total)))
const distribution = computed(() => [
  { label: 'Benar mandiri', count: report.value.correct, color: 'var(--green)' },
  { label: 'Salah', count: report.value.wrong, color: '#dc6678' },
  { label: 'Dibantu', count: report.value.assisted, color: 'var(--accent)' },
  { label: 'Dilewati', count: report.value.skipped, color: 'var(--muted)' }
])
const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)
function refreshDate() { now.value = new Date() }
onMounted(() => window.addEventListener('focus', refreshDate))
onBeforeUnmount(() => window.removeEventListener('focus', refreshDate))
</script>

<template>
  <div class="report-page">
    <div class="page-heading">
      <div><span class="eyebrow">CATATAN PERKEMBANGANMU</span><h1>Raport Belajar</h1><p>Setiap latihan adalah langkah maju. Lihat hasil usahamu di sini.</p></div>
      <LanguageSwitch />
    </div>
    <div class="report-toolbar">
      <div class="report-periods" role="group" aria-label="Periode raport">
        <button v-for="option in periods" :key="option.value" :class="{ selected: period === option.value }" :aria-pressed="period === option.value" @click="period = option.value; refreshDate()">{{ option.label }}</button>
      </div>
      <span>Sampai {{ formatDate(now) }} · waktu lokal</span>
    </div>

    <section v-if="!report.total" class="panel report-empty">
      <span class="report-empty-icon"><AppIcon name="report" :size="38" /></span>
      <h2>Raportmu menunggu cerita pertama</h2>
      <p>Belum ada jawaban latihan {{ language === 'ja' ? 'Jepang' : 'Korea' }} untuk periode {{ periodLabel.toLowerCase() }}. Setelah berlatih, nilai dan saran belajarmu akan muncul di sini.</p>
      <NuxtLink to="/latihan" class="button">Mulai latihan <AppIcon name="arrow" :size="18" /></NuxtLink>
      <button v-if="period !== 'all'" class="text-button" @click="period = 'all'">Lihat semua waktu</button>
    </section>

    <template v-else>
      <section class="panel report-summary" aria-labelledby="report-summary-title">
        <div class="report-summary-copy">
          <span class="eyebrow">{{ language === 'ja' ? 'BAHASA JEPANG' : 'BAHASA KOREA' }} · {{ periodLabel }}</span>
          <h2 id="report-summary-title">{{ report.grade === 'A' ? 'Kerja bagus, pertahankan ritmemu!' : report.grade === 'B' ? 'Fondasi yang baik, terus lanjutkan!' : 'Sedikit demi sedikit, semakin bisa.' }}</h2>
          <p>Kamu melatih <strong>{{ report.items }} materi</strong> dalam <strong>{{ report.activeDays }} hari aktif</strong>. {{ focus.length ? 'Ulangi materi yang masih sulit agar bacaanmu semakin mantap.' : 'Coba materi berikutnya dan jaga kebiasaan belajarmu.' }}</p>
          <span class="report-local"><AppIcon name="lock" :size="14" /> Raport pribadi · tersimpan di browser ini</span>
        </div>
        <div class="report-grade" aria-label="Nilai raport">
          <span>Nilai akurasi</span><strong>{{ report.grade || '—' }}</strong><b>{{ gradeCopy }}</b><small>{{ report.grade ? `${percent(report.accuracy)} benar mandiri` : `${report.total}/20 jawaban untuk nilai awal` }}</small>
        </div>
      </section>

      <div class="report-metrics">
        <div class="panel"><AppIcon name="target" /><strong>{{ percent(report.accuracy) }}</strong><span>Akurasi mandiri</span><small>{{ report.correct }} dari {{ report.total }} jawaban</small></div>
        <div class="panel"><AppIcon name="check" /><strong>{{ report.completed }}</strong><span>Sesi selesai</span><small>{{ report.sessions.length }} sesi dengan jawaban</small></div>
        <div class="panel"><AppIcon name="clock" /><strong>{{ Math.round(report.responseMs / 60000) }} <small>menit</small></strong><span>Waktu menjawab</span><small>Total waktu respons soal</small></div>
        <div class="panel"><AppIcon name="book" /><strong>{{ report.items }}</strong><span>Materi dilatih</span><small>Huruf dan kata unik</small></div>
      </div>

      <div class="report-columns">
        <section class="panel" aria-labelledby="report-activity-title">
          <div class="report-section-heading"><h2 id="report-activity-title">Ritme belajarmu</h2><span>7 hari terakhir</span></div>
          <p class="report-caption">Jumlah jawaban setiap hari, termasuk sesi yang belum selesai.</p>
          <div class="report-bars">
            <div v-for="day in days" :key="day.key" class="report-day" :aria-label="`${day.date}: ${day.total} jawaban`">
              <strong>{{ day.total }}</strong><div class="report-bar-track"><div :style="{ height: `${day.total / maxDaily * 100}%` }" /></div><span>{{ day.label }}</span>
            </div>
          </div>
        </section>
        <section class="panel" aria-labelledby="report-answers-title">
          <div class="report-section-heading"><h2 id="report-answers-title">Di balik jawabanmu</h2><AppIcon name="chart" /></div>
          <p class="report-caption">{{ report.total }} jawaban selama {{ periodLabel.toLowerCase() }}.</p>
          <div class="report-distribution" role="img" :aria-label="distribution.map(entry => `${entry.label}: ${entry.count}`).join(', ')"><span v-for="entry in distribution.filter(entry => entry.count)" :key="entry.label" :style="{ flex: entry.count, background: entry.color }" /></div>
          <ul class="report-legend"><li v-for="entry in distribution" :key="entry.label"><i :style="{ background: entry.color }" /><span>{{ entry.label }}</span><strong>{{ entry.count }}</strong></li></ul>
        </section>
      </div>

      <section class="panel report-subjects" aria-labelledby="report-subjects-title">
        <div class="report-section-heading"><h2 id="report-subjects-title">Rincian per materi</h2><span>{{ report.rows.length }} kategori dilatih</span></div>
        <div class="table-wrap"><table><caption class="report-caption">Gabungan latihan ketik dan pilihan ganda pada periode terpilih.</caption><thead><tr><th scope="col">Materi</th><th scope="col">Cakupan</th><th scope="col">Benar / total</th><th scope="col">Akurasi mandiri</th><th scope="col">Catatan</th></tr></thead><tbody>
          <tr v-for="row in report.rows" :key="row.key"><th scope="row">{{ scriptLabels[row.script] }} <span class="report-kind">{{ row.kind === 'letter' ? 'Huruf' : 'Kata' }}</span></th><td>{{ row.items }} materi</td><td>{{ row.correct }} / {{ row.total }}</td><td><div class="report-accuracy"><strong>{{ percent(row.accuracy) }}</strong><span><i :style="{ width: `${row.accuracy}%` }" /></span></div></td><td>{{ row.total < 20 ? 'Data awal' : row.accuracy >= 90 ? 'Pertahankan' : row.accuracy >= 80 ? 'Terus latih' : 'Ulangi perlahan' }}</td></tr>
        </tbody></table></div>
      </section>

      <section class="panel report-next" aria-labelledby="report-next-title">
        <div class="report-section-heading"><h2 id="report-next-title">Langkah kecil berikutnya</h2><AppIcon name="spark" /></div>
        <p class="report-caption">{{ focus.length ? 'Prioritas dari jawaban dalam periode ini. Mulai dengan latihan santai.' : 'Belum ada kesulitan yang tersisa pada jawaban terbaru dalam periode ini. Lanjutkan latihan untuk memperkuat ingatan.' }}</p>
        <ul v-if="focus.length" class="report-focus"><li v-for="row in focus" :key="row.itemId">
          <NuxtLink :to="`/materi/${encodeURIComponent(row.itemId)}`" class="report-glyph" :aria-label="`Pelajari ${row.item.glyph}, ${row.item.answer}`">{{ row.item.glyph }}</NuxtLink>
          <div><strong>{{ row.item.answer }}</strong><p>{{ scriptLabels[row.item.script] }} · {{ row.reason }}</p></div>
          <NuxtLink :to="{ path: '/latihan', query: { script: row.item.script, kind: row.item.kind, items: row.itemId, mode: 'relaxed' } }" class="button secondary" :aria-label="`Latih ${row.item.glyph}`">Latih <AppIcon name="arrow" :size="16" /></NuxtLink>
        </li></ul>
        <NuxtLink v-else to="/latihan" class="button secondary">Lanjut latihan <AppIcon name="arrow" :size="16" /></NuxtLink>
      </section>
      <details class="disclosure report-method"><summary>Cara membaca raport</summary><p>Nilai berdasarkan persentase jawaban benar mandiri: A ≥ 90%, B ≥ 80%, C ≥ 65%, dan D di bawah 65%. Nilai baru muncul setelah 20 jawaban. Ini ringkasan latihan, bukan sertifikasi kemampuan bahasa.</p><p>Jawaban dibantu dan dilewati tetap masuk jumlah soal, tetapi tidak dihitung benar mandiri. Periode memakai tanggal jawaban dalam waktu lokal; data lama tanpa tanggal jawaban memakai tanggal mulai sesi. Sesi selesai dihitung jika memiliki jawaban pada periode ini. Waktu menjawab adalah total waktu respons, bukan lama membuka aplikasi.</p><p>Raport merangkum latihan biasa. Hasil Perjalanan Belajar dan Typing Race memiliki penilaian tersendiri. Untuk riwayat tiap sesi, buka <NuxtLink to="/progres" class="text-link">halaman Progres</NuxtLink>.</p></details>
    </template>
  </div>
</template>

<style scoped>
.report-page { max-width: 1080px; margin-inline: auto; }
.report-toolbar, .report-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.report-toolbar { margin-bottom: 24px; }
.report-toolbar > span, .report-section-heading > span, .report-caption, .report-local { color: var(--muted); font-size: 12px; }
.report-periods { display: flex; padding: 4px; gap: 4px; background: var(--surface); border: 1px solid var(--line); border-radius: 13px; }
.report-periods button { min-height: 42px; border: 0; background: transparent; color: var(--muted); padding: 8px 16px; border-radius: 9px; font-size: 12px; font-weight: 700; }
.report-periods button.selected { background: var(--accent-light); color: var(--accent); }
.report-summary { display: grid; grid-template-columns: 1fr 180px; align-items: center; gap: 32px; background: var(--surface); border-top: 4px solid var(--accent); }
.report-summary h2 { font-size: clamp(21px, 2.6vw, 28px); line-height: 1.4; }
.report-summary-copy > p { max-width: 540px; color: var(--muted); margin: 12px 0 20px; font-size: 13px; }
.report-local { display: inline-flex; align-items: center; gap: 6px; }
.report-grade { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 18px 12px; background: var(--accent-light); color: var(--accent); border-radius: 18px; }
.report-grade > span { font-size: 11px; font-weight: 700; }
.report-grade > strong { font-size: 70px; line-height: 1.2; }
.report-grade b { font-size: 13px; }
.report-grade small { font-size: 10px; margin-top: 8px; }
.report-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-block: 24px; }
.report-metrics .panel { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; padding: 20px; }
.report-metrics svg { color: var(--accent); margin-bottom: 5px; }
.report-metrics strong { font-size: 30px; line-height: 1.2; letter-spacing: -1px; }
.report-metrics strong small { font-size: 13px; letter-spacing: 0; }
.report-metrics span { font-size: 12px; font-weight: 700; }
.report-metrics small { font-size: 11px; color: var(--muted); }
.report-columns { display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px; }
.report-section-heading h2 { font-size: 17px; }
.report-section-heading svg { color: var(--accent); }
.report-caption { margin-top: 10px; line-height: 1.7; }
.report-bars { height: 177px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.report-day { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
.report-day > strong { font-size: 11px; }
.report-day > span { color: var(--muted); font-size: 11px; }
.report-bar-track { width: 100%; max-width: 36px; flex: 1; display: flex; align-items: flex-end; border-radius: 6px; background: var(--surface-soft); overflow: hidden; }
.report-bar-track > div { width: 100%; background: var(--accent); border-radius: 6px; }
.report-distribution { display: flex; gap: 3px; height: 14px; overflow: hidden; border-radius: 6px; margin-block: 24px; }
.report-legend { padding: 0; margin: 0; list-style: none; display: grid; gap: 12px; }
.report-legend li { display: flex; align-items: center; gap: 9px; font-size: 12px; }
.report-legend i { width: 9px; height: 9px; border-radius: 3px; }
.report-legend span { flex: 1; color: var(--muted); }
.report-subjects, .report-next { margin-top: 24px; }
.report-subjects caption { text-align: left; caption-side: top; padding-bottom: 18px; }
.report-subjects table { width: 100%; }
.report-subjects tbody th { text-align: left; white-space: nowrap; color: var(--ink); font-size: 13px; }
.report-kind { display: block; font-size: 11px; font-weight: 400; color: var(--muted); margin-top: 5px; }
.report-accuracy { display: flex; align-items: center; gap: 12px; }
.report-accuracy strong { min-width: 36px; font-size: 12px; }
.report-accuracy > span { width: 70px; height: 6px; border-radius: 4px; background: var(--accent-light); overflow: hidden; }
.report-accuracy i { display: block; height: 100%; background: var(--accent); }
.report-focus { list-style: none; margin: 16px 0 0; padding: 0; }
.report-focus li { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line); }
.report-focus li:last-child { border: 0; padding-bottom: 0; }
.report-glyph { display: grid; place-items: center; min-width: 58px; min-height: 56px; padding: 8px; font-size: 26px; border-radius: 12px; background: var(--accent-light); color: var(--ink); }
.report-focus li > div { flex: 1; min-width: 0; }
.report-focus p { font-size: 12px; color: var(--muted); }
.report-focus .button { flex-shrink: 0; }
.report-next > .button { margin-top: 18px; }
.report-method { margin-top: 24px; }
.report-empty { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; padding: 56px 24px; }
.report-empty-icon { display: grid; place-items: center; width: 82px; height: 82px; background: var(--accent-light); color: var(--accent); border-radius: 24px; }
.report-empty p { max-width: 460px; color: var(--muted); font-size: 13px; }
@media (max-width: 1000px) { .report-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .report-columns { grid-template-columns: 1fr; } }
@media (max-width: 680px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .report-summary { grid-template-columns: 1fr; gap: 20px; }
  .report-grade { flex-direction: row; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .report-grade > strong { font-size: 42px; }
  .report-grade small { flex-basis: 100%; margin: 0; }
  .report-metrics { gap: 12px; }
  .report-metrics .panel { padding: 16px; }
  .report-periods button { padding-inline: 12px; }
  .report-focus li { gap: 10px; flex-wrap: wrap; }
  .report-focus .button { min-height: 44px; padding: 8px 12px; font-size: 12px; }
  .report-bars { gap: 8px; }
}
</style>
