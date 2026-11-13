<script setup lang="ts">
const props = defineProps<{ title: string, values: number[], labels: string[], unit: string, percent?: boolean, description: string }>()
const ceiling = computed(() => props.percent ? 100 : Math.max(1, Math.ceil(props.values.reduce((max, value) => Math.max(max, value), 0) * 1.15)))
const dots = computed(() => props.values.map((value, i) => ({ x: 48 + i / Math.max(1, props.values.length - 1) * 460, y: 152 - value / ceiling.value * 120, value, label: props.labels[i] })))
</script>

<template>
  <figure class="panel result-line-chart">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <svg v-if="values.length" viewBox="0 0 540 190" role="img" :aria-label="`${title}: ${values.map((v, i) => `${labels[i]}: ${v.toFixed(1)} ${unit}`).join('; ')}`">
      <g v-for="fraction in [0, .5, 1]" :key="fraction" class="chart-axis">
        <path :d="`M48 ${152 - fraction * 120}H508`" stroke="#d9d4e3" stroke-dasharray="4 4" />
        <text x="38" :y="156 - fraction * 120" text-anchor="end">{{ (ceiling * fraction).toFixed(ceiling < 5 ? 1 : 0) }}</text>
      </g>
      <text x="48" y="18" class="chart-axis">{{ unit }}</text>
      <polyline :points="dots.map(p => `${p.x},${p.y}`).join(' ')" fill="none" stroke="#683cf2" stroke-width="3" stroke-linejoin="round" />
      <circle v-for="(p, index) in dots" :key="index" :cx="p.x" :cy="p.y" r="4" fill="#683cf2"><title>{{ p.label }}: {{ p.value.toFixed(1) }} {{ unit }}</title></circle>
      <g class="chart-axis"><text x="48" y="180">{{ labels[0] }}</text><text v-if="labels.length > 1" x="508" y="180" text-anchor="end">{{ labels.at(-1) }}</text></g>
    </svg>
    <p v-else>Belum ada jawaban untuk grafik ini.</p>
  </figure>
</template>

<style scoped>
.result-line-chart { margin: 0; min-width: 0; }
h3 { font-size: 1rem; margin-bottom: 8px; }
p { color: var(--muted); font-size: .8rem; line-height: 1.6; margin-bottom: 12px; }
svg { display: block; width: 100%; height: auto; }
</style>
