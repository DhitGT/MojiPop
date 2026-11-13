<script setup lang="ts">
import type { Session } from '~/types/learning'
const props = defineProps<{ session: Session }>()
const distribution = computed(() => [
  { label: 'Benar', outcome: 'correct', color: '#16a34a' },
  { label: 'Salah', outcome: 'wrong', color: '#ef4444' },
  { label: 'Dibantu', outcome: 'assisted', color: '#8b5cf6' },
  { label: 'Dilewati', outcome: 'skipped', color: '#64748b' }
].map(entry => ({ ...entry, count: props.session.attempts.filter(a => a.outcome === entry.outcome).length })))
const trend = computed(() => {
  let correct = 0
  return props.session.attempts.map((attempt, index) => {
    if (attempt.outcome === 'correct') correct++
    return { x: 42 + index / Math.max(1, props.session.attempts.length - 1) * 390, y: 142 - correct / (index + 1) * 110, accuracy: Math.round(correct / (index + 1) * 100) }
  })
})
const points = computed(() => trend.value.map(point => `${point.x},${point.y}`).join(' '))
</script>

<template>
  <section v-if="session.attempts.length" class="session-charts" aria-label="Grafik hasil latihan">
    <div class="panel answer-chart">
      <h2>Hasil jawaban</h2>
      <div class="outcome-bar" role="img" :aria-label="distribution.map(entry => `${entry.label}: ${entry.count}`).join(', ')">
        <span v-for="entry in distribution.filter(entry => entry.count)" :key="entry.outcome" :style="{ flex: entry.count, background: entry.color }" />
      </div>
      <ul class="chart-legend"><li v-for="entry in distribution.filter(entry => entry.count)" :key="entry.outcome"><i :style="{ background: entry.color }" />{{ entry.label }} <strong>{{ entry.count }}</strong></li></ul>
    </div>
    <div class="panel accuracy-chart">
      <h2>Akurasi selama sesi</h2>
      <svg viewBox="0 0 456 182" role="img" :aria-label="`Grafik akurasi kumulatif dari ${trend[0]?.accuracy}% ke ${trend.at(-1)?.accuracy}% dalam ${session.attempts.length} jawaban`">
        <g stroke="#e2e8f0" stroke-dasharray="4 4"><path d="M42 32H432M42 87H432M42 142H432" /></g>
        <g class="chart-axis"><text x="10" y="17">%</text><text x="0" y="36">100</text><text x="8" y="91">50</text><text x="14" y="146">0</text><text x="42" y="171">Soal 1</text><text x="432" y="171" text-anchor="end">Soal {{ session.attempts.length }}</text></g>
        <polyline :points="points" fill="none" stroke="#7c3aed" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
        <circle v-if="trend.length" :cx="trend.at(-1)!.x" :cy="trend.at(-1)!.y" r="5" fill="#7c3aed" />
      </svg>
    </div>
  </section>
</template>
