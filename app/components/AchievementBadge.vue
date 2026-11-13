<script setup lang="ts">
import type { AchievementMetric } from '~/utils/achievements'
const props = defineProps<{ category: AchievementMetric; tier: number; label: string; silhouette?: boolean }>()
const palette = computed(() => props.tier >= 7 ? { rim: '#ad72da', soft: '#f3e7ff', metal: '#efc568' } : props.tier >= 4 ? { rim: '#d9a043', soft: '#fff2d4', metal: '#f9cf67' } : props.tier >= 2 ? { rim: '#90a7bd', soft: '#ecf3fa', metal: '#c3d4e5' } : { rim: '#be8b6c', soft: '#fbede1', metal: '#deb08b' })
const cat = computed(() => {
  if (['mastered', 'answerStreak', 'correct'].includes(props.category)) return { fur: '#36c9bb', inner: '#ffc3bc', patch: '#fff4d8', ink: '#214b4a' }
  if (['explored', 'days', 'sessions'].includes(props.category)) return { fur: '#ffb45d', inner: '#ef8e89', patch: '#fff2da', ink: '#604139' }
  if (props.category === 'perfect') return { fur: '#464658', inner: '#ba96b4', patch: '#656174', ink: '#fff0cd' }
  return { fur: '#fff3dd', inner: '#edb5bc', patch: '#ffe5db', ink: '#65515f' }
})
</script>

<template>
  <svg class="achievement-badge" :class="{ 'badge-silhouette': silhouette }" viewBox="0 0 160 168" role="img" :aria-label="label" :data-category="category" :data-tier="tier" xmlns="http://www.w3.org/2000/svg">
    <circle class="badge-backdrop" cx="80" cy="78" r="66" :fill="palette.soft" />
    <circle class="badge-backdrop" cx="80" cy="78" r="61" fill="none" :stroke="palette.rim" stroke-width="2" :stroke-dasharray="tier >= 4 ? undefined : '3 5'" />
    <g v-if="tier >= 4" :fill="palette.metal" :stroke="palette.rim" stroke-width="1.5"><path d="M28 121Q9 90 24 66Q18 90 35 111Z" /><path d="M132 121Q151 90 136 66Q142 90 125 111Z" /><ellipse v-for="n in 3" :key="n" :cx="19 + n * 3" :cy="81 + n * 10" rx="5" ry="9" :transform="`rotate(-40 ${19 + n * 3} ${81 + n * 10})`" /><ellipse v-for="n in 3" :key="`r${n}`" :cx="141 - n * 3" :cy="81 + n * 10" rx="5" ry="9" :transform="`rotate(40 ${141 - n * 3} ${81 + n * 10})`" /></g>
    <g stroke="#4e3c58" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M36 71 30 35Q48 34 61 52Q80 46 99 52Q112 34 130 35L124 71Q140 101 120 117Q104 129 80 127Q55 129 40 117Q20 102 36 71Z" :fill="cat.fur" />
      <path d="m38 44 5 23 15-9ZM122 44l-5 23-15-9Z" :fill="cat.inner" stroke="none" />
      <ellipse cx="80" cy="103" rx="27" ry="18" :fill="cat.patch" stroke="none" />
      <path v-if="tier >= 5" d="m49 84 7-5 7 5m34 0 7-5 7 5" fill="none" :stroke="cat.ink" stroke-width="3.5" />
      <g v-else :fill="cat.ink" stroke="none"><ellipse cx="56" cy="83" rx="4.5" ry="6" /><ellipse cx="104" cy="83" rx="4.5" ry="6" /><circle cx="57" cy="81" r="1.5" fill="white" /><circle cx="105" cy="81" r="1.5" fill="white" /></g>
      <g fill="#f29aa7" opacity=".65" stroke="none"><ellipse cx="44" cy="98" rx="8" ry="4" /><ellipse cx="116" cy="98" rx="8" ry="4" /></g>
      <path d="m76 98 4 3 4-3Z" :fill="cat.ink" :stroke="cat.ink" stroke-width="2" /><path d="M80 102v4q-6 7-12 0m12 0q6 7 12 0" fill="none" :stroke="cat.ink" stroke-width="2" />
      <!-- Each category has a distinct head accessory. Tier adds its own finish. -->
      <g v-if="category === 'mastered'"><path d="m49 56 23-41 13 12 8-5 16 35Z" fill="#9575d9" /><path d="M44 57q36-11 72 0" stroke="#67499c" stroke-width="7" /><path d="m76 32 2 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1Z" fill="#ffe094" stroke="none" /></g>
      <g v-else-if="category === 'explored'"><path d="M48 53q0-30 32-30t32 30" fill="#c6ac74" /><path d="M39 57q41-16 82 0l-2 8q-39-10-78 0Z" fill="#e8cf99" /><path d="M51 47h58v9H51Z" fill="#7f9a78" stroke="none" /><circle cx="81" cy="51" r="5" fill="#ffe5a6" /></g>
      <g v-else-if="category === 'correct'" fill="#81bb7b" stroke="#3c7b62" stroke-width="1.7"><path d="M45 67q3-28 25-34M115 67q-3-28-25-34" fill="none" /><ellipse cx="52" cy="48" rx="5" ry="10" transform="rotate(-32 52 48)" /><ellipse cx="63" cy="38" rx="5" ry="10" transform="rotate(-48 63 38)" /><ellipse cx="108" cy="48" rx="5" ry="10" transform="rotate(32 108 48)" /><ellipse cx="97" cy="38" rx="5" ry="10" transform="rotate(48 97 38)" /><path d="m71 53 7 7 13-15" fill="none" stroke="#fff3cb" stroke-width="5" /></g>
      <g v-else-if="category === 'sessions'"><path d="M35 62q45-20 90 0l-2 12q-43-17-86 0Z" fill="#ef8d94" /><path d="m122 66 18-9-3 17-14-1m0-1 12 8-8 8-10-16" fill="#ef8d94" /><circle cx="80" cy="61" r="8" fill="#fff1dc" stroke="none" /></g>
      <g v-else-if="category === 'days'"><path d="m103 58 15-20m-5 13q-16-1-10-13 13 0 10 13" fill="#8fc18b" stroke="#537d63" /><g fill="#f5a6bd"><ellipse cx="119" cy="31" rx="6" ry="10" /><ellipse cx="119" cy="31" rx="6" ry="10" transform="rotate(72 119 38)" /><ellipse cx="119" cy="31" rx="6" ry="10" transform="rotate(144 119 38)" /><ellipse cx="119" cy="31" rx="6" ry="10" transform="rotate(216 119 38)" /><ellipse cx="119" cy="31" rx="6" ry="10" transform="rotate(288 119 38)" /></g><circle cx="119" cy="38" r="6" fill="#ffe28f" /></g>
      <g v-else-if="category === 'dailyStreak'"><path d="M61 53q-12-14 3-27l5 10q14-10 12-24 28 22 20 39Z" fill="#f69b55" /><path d="M73 53q-6-13 8-24 0 10 9 16l-2 9Z" fill="#ffe19b" stroke="none" /><path d="M47 62q33-12 66 0" fill="none" stroke="#e57959" stroke-width="8" /></g>
      <g v-else-if="category === 'answerStreak'"><path d="M43 62q37-18 74 0" fill="none" stroke="#8279cf" stroke-width="10" /><path d="m87 22-22 29h15l-5 20 23-31H84Z" fill="#ffe080" /></g>
      <g v-else-if="category === 'perfect'"><path d="m52 52-6-26 21 12 13-22 13 22 21-12-6 26Z" fill="#f6cc69" /><path d="M53 52h54v9H53Z" fill="#e5ac55" /><path d="m80 35 6 8-6 8-6-8Z" fill="#c48ee1" /><circle cx="46" cy="24" r="3" fill="#ffe5ac" /><circle cx="114" cy="24" r="3" fill="#ffe5ac" /></g>
      <g v-else><path d="m42 38 38-16 38 16-38 16Z" fill="#7773b0" /><path d="M57 45v15q23-12 46 0V45" fill="#9390cb" /><path d="M115 39v23m0-2-4 8h8Z" fill="#f6ce76" stroke="#e4b65c" /></g>
      <g v-if="tier >= 7" fill="#fff3ae" stroke="#cda750" stroke-width="1.3"><path d="m24 29 2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM136 103l2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" /></g>
      <path d="m49 135-8 20 19-4 9 12 10-28m32 0 8 20-19-4-9 12-10-28" :fill="palette.rim" stroke="none" />
      <rect x="49" y="123" width="62" height="27" rx="13.5" :fill="palette.metal" :stroke="palette.rim" stroke-width="2" />
    </g>
    <text x="80" y="141" text-anchor="middle" fill="#513e54" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="800">{{ tier }}</text>
    <g v-if="tier >= 2" fill="#fff3ae" stroke="#bd9753" stroke-width="1"><path v-for="n in Math.min(3, Math.ceil(tier / 3))" :key="n" :d="`M${65 + (n - 1) * 15} 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5Z`" /></g>
  </svg>
</template>

<style scoped>
.achievement-badge { display: block; width: 140px; height: auto; max-width: 100%; overflow: visible; }
</style>
