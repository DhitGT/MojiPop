<script setup lang="ts">
import { mascots, typingMood } from '~/data/mascots'
import type { MascotId, MascotMood } from '~/data/mascots'
const props = defineProps<{ stroke: number; typedKey: string; character: MascotId; mistake: boolean }>()
const profile = computed(() => mascots[props.character])
const clipId = useId()
const store = useLearningStore()
const leftBeat = ref(0)
const rightBeat = ref(0)
const leftDown = ref(false)
const rightDown = ref(false)
const activeKey = ref('')
const expression = ref<MascotMood>('idle')
const eyes = computed(() => profile.value.eyes)
const expressionLabel = computed(() => profile.value.lines[expression.value])
let recent: number[] = []
let streak = 0
const systemReducedMotion = ref(false)
const hidden = ref(false)
const reduced = computed(() => store.data.value.settings.reducedMotion || systemReducedMotion.value || hidden.value)
const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const leftPosition = ref({ x: 83, y: 144 })
const rightPosition = ref({ x: 160, y: 144 })
function keyPosition(key: string) {
  for (const [row, letters] of rows.entries()) {
    const column = letters.indexOf(key)
    if (key.length === 1 && column >= 0) {
      // Match the key centres after the keyboard's 180-degree rotation.
      return { x: 242 - (46.5 + column * 15 + row * 6), y: 312 - (144.5 + row * 8) }
    }
  }
  if (key === 'backspace') return { x: 46, y: 156 }
  return undefined
}
function pawStyle(position: { x: number; y: number }, originX: number) {
  return { transform: `translate(${position.x - originX}px, ${position.y - 144}px)` }
}
function armPath(position: { x: number; y: number }, shoulder: number) {
  return `M${shoulder} 122 Q${shoulder} ${position.y - 10} ${position.x} ${position.y - 8}`
}
const floating = ref<{ id: number; label: string }[]>([])
const floatingTimers = new Map<number, ReturnType<typeof setTimeout>>()
let release: ReturnType<typeof setTimeout> | undefined
let idleTimer: ReturnType<typeof setTimeout> | undefined
let expressionTimer: ReturnType<typeof setTimeout> | undefined
let media: MediaQueryList | undefined
function rest() {
  clearTimeout(release)
  leftDown.value = false
  rightDown.value = false
  activeKey.value = ''
}
function scheduleSleep() {
  clearTimeout(idleTimer)
  if (!reduced.value) idleTimer = setTimeout(() => { expression.value = 'sleepy' }, profile.value.sleepAfter)
}
function resetMood() {
  leftPosition.value = { x: 83, y: 144 }
  rightPosition.value = { x: 160, y: 144 }
  clearTimeout(idleTimer)
  clearTimeout(expressionTimer)
  expression.value = 'idle'
  recent = []
  streak = 0
}
function removeFloating(id: number) {
  clearTimeout(floatingTimers.get(id))
  floatingTimers.delete(id)
  floating.value = floating.value.filter(item => item.id !== id)
}
function clearFloating() {
  floatingTimers.forEach(timer => clearTimeout(timer))
  floatingTimers.clear()
  floating.value = []
}
function syncMedia() { systemReducedMotion.value = media?.matches || false }
function syncVisibility() { hidden.value = document.hidden }
function greet() {
  clearTimeout(expressionTimer)
  expression.value = 'laughing'
  expressionTimer = setTimeout(() => { expression.value = 'idle' }, 1200)
  scheduleSleep()
}
watch(() => props.stroke, () => {
  if (!props.stroke || reduced.value) { rest(); clearFloating(); resetMood(); scheduleSleep(); return }
  clearTimeout(release)
  const key = props.typedKey.toLowerCase()
  activeKey.value = key
  // The keyboard faces the mascot, so its left-hand keys appear on the viewer's right.
  const leftHandKey = 'qwertasdfgzxcvb'.includes(key)
  leftDown.value = key === ' ' || !leftHandKey
  rightDown.value = key === ' ' || leftHandKey
  const target = keyPosition(key)
  if (key === ' ') {
    leftPosition.value = { x: 103, y: 143.5 }
    rightPosition.value = { x: 138, y: 143.5 }
  } else if (target) {
    if (leftDown.value) leftPosition.value = target
    if (rightDown.value) rightPosition.value = target
  }
  if (leftDown.value) leftBeat.value++
  if (rightDown.value) rightBeat.value++
  const now = performance.now()
  recent = recent.filter(at => now - at < 2000)
  if (key !== 'backspace') recent.push(now)
  streak = props.mistake || key === 'backspace' ? 0 : streak + 1
  clearTimeout(expressionTimer)
  expression.value = typingMood(props.character, recent.length, streak, props.mistake)
  expressionTimer = setTimeout(() => { expression.value = 'idle' }, expression.value === 'laughing' || expression.value === 'overwhelmed' ? 1200 : 700)
  scheduleSleep()
  if (floating.value.length >= 8) removeFloating(floating.value[0]!.id)
  const id = props.stroke
  floating.value.push({ id, label: key === 'backspace' ? '⌫' : key === ' ' ? '␣' : props.typedKey })
  floatingTimers.set(id, setTimeout(() => removeFloating(id), 850))
  release = setTimeout(rest, 180)
})
watch(reduced, paused => { if (paused) { rest(); clearFloating(); resetMood() } else scheduleSleep() })
watch(() => props.character, () => { rest(); clearFloating(); resetMood(); scheduleSleep() })
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  syncMedia()
  syncVisibility()
  media.addEventListener('change', syncMedia)
  document.addEventListener('visibilitychange', syncVisibility)
  scheduleSleep()
})
onBeforeUnmount(() => {
  rest()
  clearFloating()
  resetMood()
  media?.removeEventListener('change', syncMedia)
  document.removeEventListener('visibilitychange', syncVisibility)
})
</script>

<template>
  <button type="button" class="typing-mascot" :aria-label="`Sapa ${profile.name}`" :style="{ '--typing-fur': profile.fur, '--typing-paw': profile.paw, '--idle-duration': `${profile.idleDuration}s`, '--tap-duration': `${profile.tapDuration}ms` }" :data-character="character" :data-personality="profile.personality" :data-expression="expression" :data-motion="reduced ? 'paused' : 'running'" :data-typing="leftDown || rightDown ? 'active' : 'idle'" :data-key="activeKey || undefined" @pointerenter="greet" @focus="greet" @click="greet">
    <span class="floating-letters"><i v-for="letter in floating" :key="letter.id" :style="{ '--drift': `${(letter.id % 5 - 2) * 14}px`, '--tilt': `${(letter.id % 3 - 1) * 12}deg` }" @animationend="removeFloating(letter.id)">{{ letter.label }}</i></span>
    <svg viewBox="0 0 240 190" fill="none">
      <defs><clipPath :id="clipId"><path d="M47 0H210V119Q158 154 72 128L47 102Z" /></clipPath></defs>
      <ellipse cx="125" cy="177" rx="103" ry="8" fill="#7962d9" opacity=".1" />
      <path d="M83 117Q74 130 80 153H170Q176 125 159 117Z" fill="var(--typing-fur)" stroke="#11204a" stroke-width="3" />
      <ellipse cx="126" cy="140" rx="25" ry="19" fill="var(--typing-paw)" />
      <g class="head-pose"><g class="head-motion" :class="{ 'head-tap': leftDown || rightDown }">
        <g :class="{ 'mascot-eyes-shut': expression === 'sleepy' || expression === 'laughing' }">
          <image class="mascot-frame-open" :href="`/images/${character}-mascot.png`" x="10" y="0" width="210" height="210" :clip-path="`url(#${clipId})`" />
          <image class="mascot-frame-closed" :href="`/images/${character}-blink.png`" x="10" y="0" width="210" height="210" :clip-path="`url(#${clipId})`" />
        </g>
        <g v-if="expression === 'focused' || expression === 'angry' || expression === 'sideeye' || expression === 'unbothered'" class="focus-eyes"><path v-for="(eye, index) in eyes" :key="index" :d="`M${eye.x - 24} ${eye.y - 25} Q${eye.x} ${eye.y - 42} ${eye.x + 24} ${eye.y - 25} L${eye.x + 23} ${eye.y - 7} L${eye.x - 23} ${eye.y - 17}Z`" :fill="eye.color" stroke="#11204a" stroke-width="2" /></g>
        <g v-if="expression === 'overwhelmed'" class="overwhelmed-face">
          <g v-for="(eye, index) in eyes" :key="index" :transform="`translate(${eye.x} ${eye.y})`">
            <ellipse rx="25" ry="30" :fill="eye.color" />
            <ellipse rx="22" ry="25" fill="#fffaf0" stroke="#11204a" stroke-width="2.5" />
            <path d="M2 1C-5-8-13 0-8 8C0 19 18 8 15-6C11-23-14-23-19-5" stroke="#11204a" stroke-width="3" stroke-linecap="round" />
          </g>
          <path d="M104 101Q122 108 139 102L141 126Q121 139 102 123Z" :fill="profile.muzzle" />
          <ellipse cx="122" cy="116" rx="9" ry="13" fill="#302145" stroke="#11204a" stroke-width="2" />
          <ellipse cx="122" cy="124" rx="5" ry="3" fill="#ff8298" />
        </g>
        <g v-if="expression === 'laughing'" class="laugh-mouth"><path d="M104 101Q122 108 139 102L141 124Q121 138 102 121Z" :fill="profile.muzzle" /><path d="M108 107Q122 113 136 107Q133 127 122 127Q112 125 108 107Z" fill="#302145" stroke="#11204a" stroke-width="2" /><path d="M115 121Q122 114 131 121Q124 130 115 121Z" fill="#ff8298" /></g>
      </g></g>
      <text v-if="expression === 'sleepy'" class="sleep-text" x="192" y="36" fill="#7962d9" font-size="21" font-weight="700">zZ</text>
      <path v-if="expression === 'oops'" d="M205 78Q191 94 205 97Q219 94 205 78Z" fill="#8bd8f6" stroke="#11204a" stroke-width="2" />
      <g v-if="expression === 'angry'" class="anger-mark" stroke="#de5c68" stroke-width="3.5" stroke-linecap="round"><path d="M197 45V52H190M205 45V52H212M190 60H197V67M212 60H205V67" /></g>
      <text v-if="expression === 'sideeye' || expression === 'unbothered'" x="197" y="52" fill="#7962d9" font-size="22" font-weight="700">{{ expression === 'sideeye' ? '…?' : '…' }}</text>
      <g v-if="expression === 'overwhelmed'" class="panic-details">
        <path d="M208 58Q193 78 207 81Q222 79 208 58ZM31 85Q20 101 31 104Q43 102 31 85Z" fill="#8bd8f6" stroke="#11204a" stroke-width="2" />
        <path d="M22 44L29 56M14 60L25 65M214 27L209 41M225 41L215 47" stroke="#d58a39" stroke-width="3" stroke-linecap="round" />
      </g>
      <path d="M31 142Q32 136 39 136H202Q209 136 210 142L220 166Q222 174 213 175H28Q20 174 22 167Z" fill="#b8a2f3" stroke="#33215d" stroke-width="3" />
      <path d="M24 166H218V171Q218 177 211 177H31Q24 177 24 171Z" fill="#7962d9" />
      <g class="keyboard-keys" transform="rotate(180 121 156)"><g v-for="(row, rowIndex) in rows" :key="row">
        <rect v-for="(key, column) in row" :key="key" :data-key="key" :x="41 + column * 15 + rowIndex * 6" :y="142 + rowIndex * 8" width="11" height="5" rx="1.5" :fill="activeKey === key ? '#d7fb57' : '#f7f0ff'" :class="{ 'key-lit': activeKey === key }" />
      </g>
      <rect x="84" y="166" width="75" height="5" rx="2" :fill="activeKey === ' ' ? '#d7fb57' : '#eee5ff'" />
      <path d="M192 150H202V162H184V157H192Z" :fill="activeKey === 'backspace' ? '#d7fb57' : '#f7f0ff'" />
      </g>
      <g class="typing-arms" stroke-linecap="round" stroke-linejoin="round">
        <path v-for="(arm, index) in [armPath(leftPosition, 82), armPath(rightPosition, 155)]" :key="index" class="typing-arm" :d="arm" stroke="#11204a" stroke-width="19" />
        <path v-for="(arm, index) in [armPath(leftPosition, 82), armPath(rightPosition, 155)]" :key="`fur-${index}`" class="typing-arm" :d="arm" stroke="var(--typing-fur)" stroke-width="13" />
      </g>
      <g class="typing-paw left-paw" :style="pawStyle(leftPosition, 83)" :data-pressed="leftDown">
        <g :key="leftBeat" :class="{ 'paw-tap': leftDown }">
        <path d="M82 121Q68 125 68 138Q68 149 82 149Q97 148 98 140L98 130" fill="var(--typing-fur)" stroke="#11204a" stroke-width="3" stroke-linecap="round" />
        <path d="M69 137Q81 128 96 137V142Q89 153 75 146Z" fill="var(--typing-paw)" />
        <path d="M79 141V146M87 141V146" stroke="#11204a" stroke-width="1.5" stroke-linecap="round" />
        </g>
      </g>
      <g class="typing-paw right-paw" :style="pawStyle(rightPosition, 160)" :data-pressed="rightDown">
        <g :key="rightBeat" :class="{ 'paw-tap': rightDown }">
        <path d="M155 121Q173 123 175 138Q176 150 161 150Q146 149 145 140L145 130" fill="var(--typing-fur)" stroke="#11204a" stroke-width="3" stroke-linecap="round" />
        <path d="M147 137Q160 129 174 138V142Q165 153 152 147Z" fill="var(--typing-paw)" />
        <path d="M157 141V147M165 141V147" stroke="#11204a" stroke-width="1.5" stroke-linecap="round" />
        </g>
      </g>
    </svg>
    <span class="mascot-identity">{{ profile.name }} · {{ profile.personality }}</span>
    <span class="mascot-caption">{{ expressionLabel }}</span>
  </button>
</template>

<style scoped>
.typing-mascot { --typing-fur: #00c9bd; position: relative; width: 150px; padding: 48px 0 0; border: 0; background: transparent; font: inherit; flex-shrink: 0; text-align: center; cursor: pointer; touch-action: manipulation; user-select: none; }
.typing-mascot:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; border-radius: 16px; }
.mascot-identity { display: block; font-size: 9px; font-weight: 700; color: var(--accent); line-height: 1.4; margin-bottom: 3px; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.mascot-caption { display: block; margin-top: -3px; font-size: 10px; color: var(--muted); line-height: 1.4; }
.floating-letters { position: absolute; left: 50%; top: 12px; z-index: 1; }
.floating-letters i { position: absolute; display: grid; place-items: center; min-width: 25px; height: 29px; padding: 0 5px; border: 1px solid #cbb8fa; border-radius: 8px; background: #fffaf3; color: #683cf2; font: 700 18px/1 ui-monospace, Consolas, monospace; box-shadow: 0 2px 0 #d9cdf0; font-style: normal; animation: float-key 850ms ease-out both; }
@keyframes float-key { 0% { opacity: 0; transform: translate(-50%, 0) scale(.7); } 15% { opacity: 1; } 65% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--drift)), -36px) rotate(var(--tilt)) scale(1.1); } }
.typing-paw { transition: transform 65ms ease-out; }
.typing-arm { transition: d 65ms ease-out; }
.paw-tap { animation: paw-type var(--tap-duration, 180ms) ease-out both; transform-box: fill-box; transform-origin: center; }
.head-pose, .head-motion { transform-origin: 125px 125px; }
.head-pose { animation: head-idle var(--idle-duration, 4s) ease-in-out infinite; }
.head-tap { animation: head-type var(--tap-duration, 180ms) ease-out infinite; }
[data-expression='focused'] .head-pose { animation: none; transform: translateY(3px) rotate(-3deg); }
[data-expression='angry'] .head-pose { animation: angry-head 200ms ease-in-out infinite; }
[data-expression='sideeye'] .head-pose { animation: none; transform: rotate(-6deg); }
[data-expression='unbothered'] .head-pose { animation: head-idle 8s ease-in-out infinite; }
[data-expression='overwhelmed'] .head-pose { animation: overwhelmed-head 180ms ease-in-out infinite; }
[data-expression='overwhelmed'] .paw-tap { animation-duration: 90ms; }
.panic-details { animation: panic-sweat 600ms ease-in-out infinite; }
[data-expression='sleepy'] .head-pose { animation: sleepy-head 3s ease-in-out infinite; }
[data-expression='laughing'] .head-pose { animation: laughing-head 350ms ease-in-out infinite; }
.sleep-text { animation: sleep-z 2s ease-in-out infinite; }
@keyframes head-idle { 0%, 100% { transform: rotate(-1deg); } 50% { transform: translateY(-2px) rotate(1deg); } }
@keyframes angry-head { 0%, 100% { transform: translateX(-1px) rotate(-2deg); } 50% { transform: translateX(1px) rotate(2deg); } }
@keyframes overwhelmed-head { 0%, 100% { transform: translate(-1.5px, -2px) rotate(-2deg); } 50% { transform: translate(1.5px, -3px) rotate(2deg); } }
@keyframes panic-sweat { 0%, 100% { transform: translateY(-1px); } 50% { transform: translateY(2px); } }
@keyframes sleepy-head { 0%, 100% { transform: rotate(5deg) translateY(2px); } 50% { transform: rotate(9deg) translateY(5px); } }
@keyframes laughing-head { 0%, 100% { transform: rotate(-3deg); } 50% { transform: translateY(-3px) rotate(3deg); } }
@keyframes sleep-z { 0%, 100% { opacity: .4; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
.key-lit { filter: drop-shadow(0 0 3px #d7fb57); }
@keyframes paw-type { 0% { transform: translateY(-4px); } 45% { transform: translateY(2px) scale(1.04, .94); } 100% { transform: translateY(0); } }
@keyframes head-type { 0% { transform: translateY(1.5px) rotate(.6deg); } 100% { transform: none; } }
[data-motion='paused'] *, [data-motion='paused'] *::before { animation: none !important; transition: none !important; }
[data-motion='paused'] .head-pose { transform: none; }
@media (prefers-reduced-motion: reduce) { .typing-mascot * { animation: none !important; transition: none !important; } }
@media (max-width: 680px) { .typing-mascot { width: 118px; } }
</style>
