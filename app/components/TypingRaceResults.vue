<script setup lang="ts">
import type { RaceSample } from '~/utils/typingRace'
import { raceConsistency } from '~/utils/typingRace'

const props = defineProps<{
  samples: RaceSample[]; wpm: number; raw: number; accuracy: number; elapsed: number
  correct: number; wrong: number; missing: number; strokes: number; errors: number
  previousWpm?: number; scriptLabel: string; kindLabel: string; sourceLength: number; duration: number
}>()
const selected = ref<number | null>(null)
const consistency = computed(() => raceConsistency(props.samples))
const ceiling = computed(() => Math.max(20, Math.ceil(Math.max(...props.samples.map(point => Math.max(point.wpm, point.raw)), props.previousWpm || 0) / 20) * 20))
const x = (at: number) => 50 + at / Math.max(1, props.elapsed) * 790
const y = (value: number) => 226 - value / ceiling.value * 194
const wpmLine = computed(() => props.samples.map(point => `${x(point.at)},${y(point.wpm)}`).join(' '))
const rawLine = computed(() => props.samples.map(point => `${x(point.at)},${y(point.raw)}`).join(' '))
const selectedPoint = computed(() => props.samples[selected.value ?? props.samples.length - 1])
const errorCount = (index: number) => props.samples[index]!.errors - (props.samples[index - 1]?.errors || 0)
const delta = computed(() => props.wpm - (props.previousWpm || 0))
</script>

<template>
  <div class="result-overview">
    <div class="result-primary panel">
      <div><span>WPM</span><strong data-testid="result-wpm">{{ wpm }}</strong></div>
      <div><span>Akurasi</span><strong data-testid="result-accuracy">{{ accuracy }}<small>%</small></strong></div>
      <p v-if="previousWpm !== undefined" :class="delta >= 0 ? 'improved' : 'slower'">{{ delta >= 0 ? '+' : '' }}{{ delta }} WPM <span>dari percobaan terakhir</span></p>
    </div>
    <figure class="panel speed-chart">
      <div class="chart-heading"><h3>Kecepatan sepanjang race</h3><span>{{ (elapsed / 1000).toFixed(1) }} detik</span></div>
      <div class="chart-legend"><span class="wpm-key">WPM</span><span class="raw-key">Raw WPM</span><span class="error-key">Kesalahan</span><span v-if="previousWpm !== undefined" class="previous-key">Hasil sebelumnya</span></div>
      <svg viewBox="0 0 870 266" role="img" :aria-label="`Grafik WPM dan raw WPM sepanjang ${(elapsed / 1000).toFixed(1)} detik. Hasil akhir ${wpm} WPM, ${raw} raw WPM. Titik merah menandai kesalahan.`">
        <g v-for="fraction in [0, .25, .5, .75, 1]" :key="fraction" class="axis">
          <path :d="`M50 ${y(ceiling * fraction)}H840`" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="4 6" />
          <text x="38" :y="y(ceiling * fraction) + 4" text-anchor="end">{{ Math.round(ceiling * fraction) }}</text>
        </g>
        <text x="50" y="17" class="axis">WPM</text>
        <g v-for="fraction in [0, .25, .5, .75, 1]" :key="fraction" class="axis"><text :x="x(elapsed * fraction)" y="252" :text-anchor="fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'">{{ (elapsed / 1000 * fraction).toFixed(elapsed < 4000 ? 1 : 0) }}s</text></g>
        <path v-if="samples.length > 1" :d="`M50 226 L${wpmLine.replaceAll(' ', ' L')} L${x(elapsed)} 226 Z`" fill="var(--accent)" opacity=".06" />
        <path v-if="previousWpm !== undefined" :d="`M50 ${y(previousWpm)}H840`" stroke="#d58a39" stroke-dasharray="6 7" opacity=".8" />
        <polyline :points="rawLine" fill="none" stroke="#a59ab7" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="5 4" />
        <polyline :points="wpmLine" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linejoin="round" />
        <template v-for="(point, index) in samples" :key="index">
          <circle v-if="errorCount(index) > 0" :cx="x(point.at)" :cy="y(point.wpm)" r="4.5" fill="#c34b68"><title>{{ errorCount(index) }} kesalahan pada {{ (point.at / 1000).toFixed(1) }} detik</title></circle>
          <circle :cx="x(point.at)" :cy="y(point.wpm)" r="12" fill="transparent" tabindex="0" :aria-label="`${(point.at / 1000).toFixed(1)} detik: ${point.wpm} WPM, ${point.raw} raw WPM, ${point.accuracy}% akurasi, ${errorCount(index)} kesalahan`" @mouseenter="selected = index" @focus="selected = index" @mouseleave="selected = null" @blur="selected = null" />
        </template>
        <g v-if="selected !== null && selectedPoint" pointer-events="none"><path :d="`M${x(selectedPoint.at)} 30V226`" stroke="var(--accent)" opacity=".3" /><circle :cx="x(selectedPoint.at)" :cy="y(selectedPoint.wpm)" r="5" fill="var(--accent)" stroke="white" stroke-width="2" /></g>
      </svg>
      <figcaption v-if="selectedPoint" class="chart-detail"><b>{{ (selectedPoint.at / 1000).toFixed(1) }}s</b><span>{{ selectedPoint.wpm }} WPM</span><span>{{ selectedPoint.raw }} raw WPM</span><span>{{ selectedPoint.accuracy }}% akurasi</span><span>{{ errorCount(selected ?? samples.length - 1) }} kesalahan</span></figcaption>
      <p class="chart-help">Arahkan kursor atau fokuskan titik grafik untuk melihat detail. Garis menunjukkan kecepatan rata-rata sejak awal race.</p>
    </figure>
  </div>
  <div class="result-secondary">
    <div class="panel result-stat"><span>Raw WPM</span><strong>{{ raw }}</strong><small>Semua ketikan per menit</small></div>
    <div class="panel result-stat"><span>Konsistensi</span><strong>{{ consistency === null ? '—' : `${consistency}%` }}</strong><small>{{ consistency === null ? 'Data waktu belum cukup' : 'Kestabilan ritme ketikan' }}</small></div>
    <div class="panel result-stat"><span>Waktu</span><strong>{{ (elapsed / 1000).toFixed(1) }}<em>s</em></strong><small>Dari batas {{ duration }} detik</small></div>
    <div class="panel result-stat"><span>Progres teks</span><strong>{{ Math.round((correct + wrong) / Math.max(1, correct + wrong + missing) * 100) }}<em>%</em></strong><small>{{ correct + wrong }} / {{ correct + wrong + missing }} karakter romaji</small></div>
  </div>
  <div class="result-details panel">
    <div><h3>Karakter</h3><p class="character-counts"><strong class="count-correct">{{ correct }}</strong><span>/</span><strong class="count-wrong">{{ wrong }}</strong><span>/</span><strong>{{ missing }}</strong></p><small>Tepat / salah / belum diketik</small><p>{{ strokes }} total ketikan · {{ errors }} kesalahan, termasuk yang diperbaiki</p></div>
    <div><h3>Jenis race</h3><p>{{ scriptLabel }} · {{ kindLabel }}</p><p>{{ sourceLength }} karakter sumber · {{ duration }} detik</p><small>Urutan acak, dipisahkan spasi</small></div>
  </div>
  <details class="result-formulas"><summary>Cara statistik dihitung</summary><p>WPM = karakter tepat pada teks akhir ÷ 5 ÷ menit. Raw WPM menghitung seluruh ketikan, termasuk yang salah dan diketik ulang. Akurasi = ketikan tepat ÷ seluruh ketikan. Konsistensi dihitung dari variasi jumlah ketikan per detik; jeda ikut dihitung. Angka ini mengikuti perhitungan KanaLearn.</p></details>
</template>

<style scoped>
.result-overview { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 20px; align-items: stretch; }
.result-primary { display: flex; flex-direction: column; justify-content: center; gap: 28px; background: var(--accent-light); }
.result-primary > div > span { display: block; color: var(--muted); font-size: 14px; }
.result-primary strong { display: block; font-size: clamp(42px, 5vw, 64px); color: var(--accent); line-height: 1.15; font-weight: 650; font-variant-numeric: tabular-nums; }
.result-primary small { font-size: .5em; }.result-primary p { font-size: 15px; font-weight: 650; }.result-primary p span { display: block; margin-top: 5px; font-size: 11px; font-weight: 400; color: var(--muted); }.improved { color: #33856c; }.slower { color: #b4354b; }
.speed-chart { margin: 0; min-width: 0; padding: 24px 20px; }
.chart-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }.chart-heading h3, .result-details h3 { font-size: 14px; }.chart-heading > span { font-size: 11px; color: var(--muted); }
.chart-legend { display: flex; flex-wrap: wrap; gap: 16px; margin: 18px 0 10px; font-size: 10px; color: var(--muted); }.chart-legend span { display: inline-flex; align-items: center; gap: 5px; }.chart-legend span::before { content: ''; display: inline-block; width: 16px; height: 3px; background: var(--accent); }.chart-legend .raw-key::before { background: #a59ab7; }.chart-legend .error-key::before { width: 6px; height: 6px; border-radius: 50%; background: #c34b68; }.chart-legend .previous-key::before { background: #d58a39; }
svg { display: block; width: 100%; height: auto; min-height: 150px; }.axis { fill: var(--muted); color: var(--muted); font-size: 12px; }circle:focus-visible { outline: none; stroke: var(--accent); stroke-width: 2px; }
.chart-detail { display: flex; flex-wrap: wrap; gap: 8px 16px; font: 11px/1.6 ui-monospace, Consolas, monospace; color: var(--muted); margin: 8px 0; }.chart-detail b { color: var(--accent); }.chart-help { font-size: 10px; line-height: 1.7; color: var(--muted); margin-top: 10px; }
.result-secondary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.result-stat { padding: 22px; min-width: 0; }.result-stat > span { color: var(--muted); font-size: 12px; }.result-stat strong { display: block; font-size: 30px; font-weight: 650; margin: 8px 0; color: var(--ink); font-variant-numeric: tabular-nums; }.result-stat em { font-size: 17px; font-style: normal; margin-left: 4px; }.result-stat small, .result-details small { color: var(--muted); font-size: 10px; line-height: 1.6; }
.result-details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }.result-details p { font-size: 12px; color: var(--muted); margin-top: 10px; }.character-counts { display: flex; gap: 10px; align-items: center; }.character-counts strong { font-size: 25px; font-weight: 650; }.count-correct { color: #33856c; }.count-wrong { color: #b4354b; }
.result-formulas { color: var(--muted); font-size: 11px; margin: 20px 0; line-height: 1.8; }.result-formulas summary { cursor: pointer; }.result-formulas p { margin-top: 8px; }
@media (max-width: 900px) { .result-overview { grid-template-columns: 140px minmax(0, 1fr); }.result-primary { padding: 20px; }.result-secondary { gap: 10px; }.result-stat { padding: 16px; } }
@media (max-width: 680px) { .result-overview { grid-template-columns: 1fr; gap: 14px; }.result-primary { flex-direction: row; flex-wrap: wrap; justify-content: start; gap: 20px 40px; }.result-primary strong { font-size: 48px; }.result-primary p { flex-basis: 100%; }.result-secondary { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 14px; }.result-details { grid-template-columns: 1fr; gap: 24px; margin-top: 14px; }.speed-chart { padding: 20px 14px; } }
</style>
