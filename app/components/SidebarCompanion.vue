<script setup lang="ts">
import { mascots, mascotIds } from '~/data/mascots'
import { companionDialogue } from '~/data/companionDialogue'

const dialogue = ref({ ...companionDialogue })
const turn = ref(0)
const paused = ref(false)
const greeted = ref(false)
let greetingTimer: ReturnType<typeof setTimeout> | undefined
const character = computed(() => mascotIds[turn.value % mascotIds.length]!)
const profile = computed(() => mascots[character.value])
const line = computed(() => {
  if (greeted.value) return profile.value.lines.laughing
  const lines = dialogue.value[character.value]
  return lines[Math.floor(turn.value / mascotIds.length) % lines.length]
})
let timer: ReturnType<typeof setInterval> | undefined

function next() { greeted.value = false; clearTimeout(greetingTimer); turn.value++ }
function greet() {
  greeted.value = true
  clearTimeout(greetingTimer)
  greetingTimer = setTimeout(() => { greeted.value = false }, 3000)
}
onMounted(() => {
  for (const id of mascotIds) {
    const lines = [...companionDialogue[id]]
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[lines[i], lines[j]] = [lines[j]!, lines[i]!]
    }
    dialogue.value[id] = lines
  }
  timer = setInterval(() => {
    if (!paused.value && !document.hidden) next()
  }, 8000)
})
onBeforeUnmount(() => { clearInterval(timer); clearTimeout(greetingTimer) })
</script>

<template>
  <section class="sidebar-companion" aria-label="Teman belajar" @mouseenter="paused = true" @mouseleave="paused = false" @focusin="paused = true" @focusout="paused = false">
    <div :key="turn" class="companion-friend">
      <p class="companion-dialogue"><span class="sr-only">{{ profile.name }} bilang: </span>{{ line }}</p>
      <KikoMascot :character="character" @interact="greet" />
      <span class="companion-name">{{ profile.name }}</span>
    </div>
    <button type="button" class="companion-next" aria-label="Tampilkan maskot berikutnya" @click="next">Teman berikutnya <span aria-hidden="true">→</span></button>
  </section>
</template>

<style scoped>
.sidebar-companion { margin-top: auto; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; gap: 4px; padding-top: 12px; overflow: visible; }
.companion-friend { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; overflow: visible; animation: companion-arrive 300ms ease-out; }
.companion-dialogue { position: absolute; left: calc(50% + 60px); top: 8px; width: 180px; margin: 0; padding: 10px 12px; border: 2px solid #ded3f6; border-radius: 16px; background: #f8f5ff; box-shadow: 0 4px 12px #49326b0d; color: #55456e; text-align: left; font-size: 12px; font-weight: 650; line-height: 1.6; z-index: 1; }
.companion-dialogue::after { content: ''; position: absolute; top: 24px; left: -7px; width: 10px; height: 10px; border-left: 2px solid #ded3f6; border-bottom: 2px solid #ded3f6; background: #f8f5ff; transform: rotate(45deg); }
.sidebar-companion .kiko-mascot { width: 110px; height: 110px; filter: drop-shadow(0 5px 0 #26233d13); }
.companion-name { margin-top: 5px; color: #5a5d72; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; }
.companion-next { padding: 6px 10px; border: 0; border-radius: 8px; background: transparent; color: #786397; font: inherit; font-size: 10px; cursor: pointer; }
.companion-next:hover { background: #f4efff; color: #5930c8; }
.companion-next:focus-visible { outline: 2px solid #8c64de; outline-offset: 2px; }
@keyframes companion-arrive { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .companion-friend { animation: none; } }
@media (min-width: 681px) and (max-height: 820px) {
  .sidebar-companion .kiko-mascot { width: 80px; height: 80px; }
}
@media (max-width: 680px) { .sidebar-companion { display: none; } }
</style>
