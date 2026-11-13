<script setup lang="ts">
const props = withDefaults(defineProps<{ decorative?: boolean, celebrate?: boolean }>(), {
  decorative: false,
  celebrate: false
})
const store = useLearningStore()
const root = ref<HTMLElement | null>(null)
const reaction = ref<'hello' | 'jump' | 'celebrate' | ''>('')
const systemReducedMotion = ref(false)
const visible = ref(true)
const tabHidden = ref(false)
const motionPaused = computed(() => store.data.value.settings.reducedMotion || systemReducedMotion.value || !visible.value || tabHidden.value)
let media: MediaQueryList | undefined
let observer: IntersectionObserver | undefined
let disposed = false

async function react(kind: 'hello' | 'jump' | 'celebrate') {
  if (motionPaused.value || (kind === 'hello' && reaction.value)) return
  reaction.value = ''
  await nextTick()
  if (!disposed && !motionPaused.value) reaction.value = kind
}
function endReaction(event: AnimationEvent) {
  if (event.target === event.currentTarget) reaction.value = ''
}
function syncMedia() { systemReducedMotion.value = media?.matches || false }
function syncVisibility() { tabHidden.value = document.hidden }
watch(motionPaused, paused => { if (paused) reaction.value = '' })

onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  syncMedia()
  syncVisibility()
  media.addEventListener('change', syncMedia)
  document.addEventListener('visibilitychange', syncVisibility)
  observer = new IntersectionObserver(entries => { visible.value = entries[0]?.isIntersecting || false })
  if (root.value) observer.observe(root.value)
  if (props.celebrate) void react('celebrate')
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  media?.removeEventListener('change', syncMedia)
  document.removeEventListener('visibilitychange', syncVisibility)
})
</script>

<template>
  <component
    :is="decorative ? 'span' : 'button'"
    ref="root"
    class="kiko-mascot"
    :type="decorative ? undefined : 'button'"
    :aria-label="decorative ? undefined : 'Sapa Kiko'"
    :aria-hidden="decorative ? 'true' : undefined"
    :data-motion="motionPaused ? 'paused' : 'running'"
    :data-reaction="reaction || undefined"
    @pointerenter="!decorative && react('hello')"
    @click="!decorative && react('jump')"
  >
    <span class="kiko-idle">
      <span class="kiko-reaction" @animationend="endReaction">
        <img src="/images/kiko-mascot.png" alt="" width="1254" height="1254" decoding="async" draggable="false">
      </span>
    </span>
    <span v-if="reaction === 'jump' || reaction === 'celebrate'" class="kiko-sparkles" aria-hidden="true"><i>✦</i><i>✦</i><i>✦</i></span>
  </component>
</template>

<style scoped>
.kiko-mascot { position: relative; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 0; background: transparent; vertical-align: middle; isolation: isolate; -webkit-tap-highlight-color: transparent; }
button.kiko-mascot { cursor: pointer; touch-action: manipulation; }
button.kiko-mascot:focus-visible { outline: 3px dashed #d7fb57; outline-offset: 5px; border-radius: 35%; }
.kiko-idle, .kiko-reaction { display: block; width: 100%; height: 100%; transform-origin: 50% 88%; }
.kiko-idle { animation: kiko-idle 3.8s ease-in-out infinite; }
.kiko-reaction img { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; }
[data-reaction='hello'] .kiko-reaction { animation: kiko-hello 700ms ease-in-out both; }
[data-reaction='jump'] .kiko-reaction { animation: kiko-jump 850ms cubic-bezier(.2,.65,.3,1) both; }
[data-reaction='celebrate'] .kiko-reaction { animation: kiko-celebrate 1200ms ease-in-out both; }
.kiko-sparkles { position: absolute; inset: 0; pointer-events: none; }
.kiko-sparkles i { position: absolute; left: 50%; top: 30%; color: #ffdf66; font-style: normal; font-size: clamp(13px, 2vw, 24px); text-shadow: 0 2px #7e4b29; opacity: 0; animation: kiko-spark 850ms ease-out both; --spark-x: -65px; --spark-y: -45px; }
.kiko-sparkles i:nth-child(2) { --spark-x: 65px; --spark-y: -30px; animation-delay: 80ms; color: #d7fb57; }
.kiko-sparkles i:nth-child(3) { --spark-x: 18px; --spark-y: -75px; animation-delay: 140ms; color: #fff; }
[data-motion='paused'] *, [data-motion='paused'] *::before, [data-motion='paused'] *::after { animation: none !important; }
@keyframes kiko-idle { 0%, 100% { transform: translateY(0) rotate(-1deg) scale(1); } 50% { transform: translateY(-5px) rotate(1.5deg) scale(1.015, 1.025); } }
@keyframes kiko-hello { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-9deg); } 55% { transform: rotate(7deg); } 78% { transform: rotate(-4deg); } }
@keyframes kiko-jump { 0%, 100% { transform: translateY(0) scale(1); } 15% { transform: translateY(2px) scale(1.07, .91); } 44% { transform: translateY(var(--kiko-jump-height, -18px)) rotate(-6deg) scale(.97, 1.06); } 70% { transform: translateY(0) rotate(3deg) scale(1.06, .94); } 86% { transform: translateY(-5px) scale(1); } }
@keyframes kiko-celebrate { 0%, 100% { transform: translateY(0) rotate(0) scale(1); } 15% { transform: scale(1.08, .9); } 38% { transform: translateY(-15px) rotate(-13deg) scale(1.05); } 58% { transform: translateY(0) rotate(9deg) scale(1.05, .95); } 78% { transform: translateY(-9px) rotate(-5deg); } }
@keyframes kiko-spark { 0% { transform: translate(-50%, 0) scale(.2) rotate(0); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--spark-x), var(--spark-y)) scale(.5) rotate(75deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .kiko-mascot *, .kiko-mascot *::before, .kiko-mascot *::after { animation: none !important; } }
@media (max-width: 680px) { .kiko-mascot { --kiko-jump-height: -9px; } }
</style>
