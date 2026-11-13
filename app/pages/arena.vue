<script setup lang="ts">
import { scriptLabels, modeLabels } from '~/data/content'
import { duration, summarize } from '~/utils/learning'
import { mascots, mascotIds } from '~/data/mascots'
const store = useLearningStore()
const route = useRoute()
const session = computed(() => store.data.value.sessions.find(session => session.id === String(route.query.id)))
const { input, assisted, feedback, elapsed, promptReady, inputElement, choiceElement, choices, choose, current, paused, submit, hint, next, pause, resume, finish } = usePractice(session)
const isChoice = computed(() => session.value?.config.answerFormat === 'choice')
const summary = computed(() => session.value ? summarize(session.value) : null)
const feedbackLabel = computed(() => feedback.value?.outcome === 'correct' ? 'Benar' : feedback.value?.outcome === 'skipped' ? 'Dilewati' : feedback.value?.outcome === 'assisted' ? 'Dibantu' : 'Belum tepat')
const streak = computed(() => {
  const attempts = session.value?.attempts || []
  let count = 0
  for (let index = attempts.length - 1; index >= 0 && attempts[index]?.outcome === 'correct'; index--) count++
  return count
})
const companion = computed(() => mascotIds[(session.value?.cursor || 0) % mascotIds.length]!)
const companionMessage = computed(() => {
  const profile = mascots[companion.value]
  if (paused.value) return profile.lines.sleepy
  if (feedback.value?.outcome === 'correct') return profile.lines.laughing
  if (feedback.value) return profile.lines[profile.mistakeMood]
  if (assisted.value) return 'Kita pelajari bareng, yuk!'
  return profile.lines.idle
})
function keydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLElement && event.target.closest('.kiko-mascot')) return
  if (isChoice.value && /^[1-4]$/.test(event.key)) {
    const answer = choices.value[Number(event.key) - 1]
    if (answer) { event.preventDefault(); choose(answer) }
  }
  if (event.key === 'Enter' && feedback.value && feedback.value.outcome !== 'correct') { event.preventDefault(); void next() }
}
</script>

<template>
  <div v-if="session && current" class="arena-stage" :class="{ 'is-paused': paused }" @keydown="keydown">
    <div class="arena-top"><div><span class="pill">{{ scriptLabels[session.config.script] }}</span><span class="pill green">{{ modeLabels[session.config.mode] }}</span></div><button v-if="!paused" class="text-button" @click="pause"><AppIcon name="pause" :size="16" /> Jeda</button><NuxtLink v-else to="/latihan" class="text-link">Keluar</NuxtLink></div>
    <div class="arena-companion">
      <KikoMascot :key="`${companion}-${feedback?.outcome === 'correct' ? session.attempts.length : 'idle'}`" :character="companion" :celebrate="feedback?.outcome === 'correct'" />
      <span :key="companionMessage" class="arena-speech">{{ companionMessage }}</span>
      <span v-if="streak >= 2" :key="streak" class="arena-streak">&#10022; {{ streak }} beruntun</span>
    </div>
    <section v-if="paused" class="panel pause-cover" aria-labelledby="pause-title"><AppIcon name="pause" :size="36" /><h1 id="pause-title">Sesi dijeda</h1><p>Soal diganti saat lanjut. Progres tetap tersimpan.</p><div class="button-row"><button class="button" @click="resume">Lanjutkan sesi <AppIcon name="play" :size="16" /></button><button class="button secondary" @click="finish()">Akhiri sesi</button></div></section>
    <section v-else class="panel arena-card" :class="{ 'round-correct': feedback?.outcome === 'correct', 'round-wrong': feedback?.outcome === 'wrong' }" aria-label="Soal latihan">
      <div class="arena-meta"><span>{{ session.config.count ? `${Math.min(session.attempts.length + (feedback ? 0 : 1), session.config.count)} / ${session.config.count}` : `${session.attempts.length} terjawab` }}</span><span class="arena-timer" :role="session.config.mode === 'sprint' ? 'timer' : undefined">{{ session.config.mode === 'sprint' ? `${Math.max(0, Math.ceil((60000 - elapsed) / 1000))} dtk` : duration(elapsed) }}</span></div>
      <div v-if="session.config.count" class="progress-bar"><span :style="{ width: `${session.attempts.length / session.config.count * 100}%` }" /></div>
      <div :key="session.cursor" class="arena-prompt" :lang="current.language" aria-label="Karakter untuk dibaca"><span class="arena-glyph">{{ current.prompt }}</span><span v-if="feedback?.outcome === 'correct'" class="arena-burst" aria-hidden="true"><i v-for="particle in 8" :key="particle" :style="{ '--particle': particle }" /></span></div>
      <div v-if="isChoice" :key="`choices-${session.cursor}`" ref="choiceElement" class="romaji-choices" role="group" aria-label="Pilihan romaji">
        <button v-for="(answer, index) in choices" :key="answer" type="button" :disabled="!promptReady || !!feedback" :class="['romaji-option', { 'is-correct': feedback && answer === current.answer, 'is-wrong': feedback?.outcome === 'wrong' && answer === feedback.input }]" @click="choose(answer)"><span class="option-number">{{ index + 1 }}</span><strong>{{ answer }}</strong><span v-if="feedback && answer === current.answer" aria-label="Jawaban benar">&#10003;</span><span v-else-if="feedback?.outcome === 'wrong' && answer === feedback.input" aria-label="Jawaban salah">&#215;</span></button>
      </div>
      <form v-else class="answer-form" @submit.prevent="submit()"><label class="sr-only" for="answer">Jawaban romanisasi</label><input id="answer" ref="inputElement" v-model="input" class="answer-input" placeholder="Ketik bacaan Latin" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" maxlength="100" :readonly="!!feedback" :disabled="!promptReady" aria-describedby="answer-help"><button v-if="!feedback" type="submit" class="button wide" :disabled="!input.trim() || !promptReady">Jawab <span style="opacity:.6">↵</span></button></form>
      <div v-if="assisted && !feedback" class="notice" role="status"><strong>{{ current.answer }}</strong> · Dengan petunjuk, bukan benar mandiri.</div>
      <div v-if="feedback" :class="['feedback', feedback.outcome]" role="status" aria-live="polite">
        <strong><AppIcon :name="feedback.outcome === 'correct' ? 'check' : feedback.outcome === 'assisted' ? 'book' : 'close'" :size="19" />{{ feedbackLabel }}</strong>
        <p v-if="feedback.outcome !== 'correct'">{{ feedback.input || '—' }} → <b>{{ current.answer }}</b><span v-if="feedback.outcome === 'assisted'"> · {{ feedback.accepted ? 'tepat' : 'belum tepat' }}</span></p>
        <p v-if="current.meaning">{{ current.meaning }}</p>
        <details v-if="!isChoice && feedback.outcome !== 'correct'" class="feedback-explanation"><summary>Penjelasan</summary><p>{{ current.note }}</p></details>
        <button v-if="!isChoice && feedback.outcome !== 'correct'" class="button secondary wide" @click="next">Lanjut ↵</button>
      </div>
      <div v-else-if="!isChoice" class="arena-tools"><button class="text-button" :disabled="assisted || !promptReady" @click="hint">{{ assisted ? 'Petunjuk dibuka' : 'Lihat petunjuk' }}</button><button class="text-button" :disabled="!promptReady" @click="submit(true)">Lewati →</button></div>
      <p id="answer-help" class="arena-help">{{ summary?.correct || 0 }} benar mandiri · Akurasi {{ Math.round(summary?.accuracy || 0) }}%</p>
    </section>
    <button v-if="!paused" class="arena-exit text-button" @click="finish()">Akhiri sesi</button>
  </div>
  <div v-else class="panel empty-state"><h1>Sesi tidak ditemukan</h1><NuxtLink to="/latihan" class="button">Mulai latihan</NuxtLink></div>
</template>

<style scoped>
.arena-stage { position: relative; isolation: isolate; }
.arena-stage::before, .arena-stage::after { content: ''; position: absolute; z-index: -1; pointer-events: none; border: 2px solid #c9b9ed; animation: arena-drift 7s ease-in-out infinite; }
.arena-stage::before { width: 48px; height: 48px; border-radius: 16px; top: 95px; left: -9px; rotate: -15deg; background: #d7fb5738; }
.arena-stage::after { width: 30px; height: 30px; border-radius: 50%; right: -7px; bottom: 80px; background: #64deea40; animation-delay: -3s; }
.arena-top { animation: arena-arrive 350ms ease-out both; }
.arena-companion { display: flex; align-items: center; gap: 12px; min-height: 70px; margin: -6px 8px 12px; }
.arena-companion :deep(.kiko-mascot) { width: 64px; height: 64px; flex-shrink: 0; }
.arena-speech { position: relative; padding: 10px 14px; border: 2px solid #c9b9ed; border-radius: 14px 14px 14px 3px; background: #fffaf0; color: #584174; font-size: 12px; font-weight: 750; animation: arena-pop 280ms ease-out both; }
.arena-streak { margin-left: auto; flex-shrink: 0; border: 2px solid #c5a43c; border-radius: 12px; padding: 7px 10px; background: #ffed8e; color: #695015; font-size: 12px; font-weight: 850; animation: arena-pop 350ms ease-out both; }
.arena-card, .pause-cover { animation: arena-arrive 350ms ease-out both; }
.arena-card { transition: border-color 180ms, box-shadow 180ms; }
.arena-card.round-correct { border-color: #65b98b; box-shadow: 0 6px 0 #65b98b; }
.arena-card.round-wrong { border-color: #df9a90; box-shadow: 0 6px 0 #df9a90; }
.arena-card .progress-bar span { transition: width 400ms cubic-bezier(.2,.7,.3,1); position: relative; overflow: hidden; }
.arena-card .progress-bar span::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 25%, #ffffff65 50%, transparent 75%); animation: arena-shimmer 3.5s ease-in-out infinite; }
.arena-prompt { position: relative; animation: arena-question 260ms ease-out both; }
.arena-glyph { display: block; max-width: 100%; animation: arena-breathe 4s ease-in-out 300ms infinite; }
.round-correct .arena-glyph { animation: arena-celebrate 500ms ease-out both; }
.round-wrong .arena-glyph { animation: arena-nudge 300ms ease-out both; }
.arena-burst { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.arena-burst i { position: absolute; font-style: normal; font-size: 22px; line-height: 1; color: #ac7bdf; opacity: 0; --angle: calc(var(--particle) * 45deg); animation: arena-particle 600ms ease-out both; }
.arena-burst i:nth-child(even) { color: #d3aa27; }
.arena-burst i::before { content: '\2726'; }
.romaji-option { transition: transform 140ms ease-out, background-color 180ms, border-color 180ms, box-shadow 180ms; animation: arena-arrive 250ms ease-out both; }
.romaji-option:nth-child(2) { animation-delay: 35ms; }
.romaji-option:nth-child(3) { animation-delay: 70ms; }
.romaji-option:nth-child(4) { animation-delay: 105ms; }
.romaji-option:not(:disabled):active, .answer-form .button:not(:disabled):active { transform: translateY(3px) scale(.98); }
.romaji-option.is-correct { animation: arena-answer-pop 380ms ease-out both; }
.romaji-option.is-wrong { animation: arena-nudge 300ms ease-out both; }
.feedback, .arena-card .notice { animation: arena-arrive 220ms ease-out both; }
.answer-input { transition: border-color 180ms, box-shadow 180ms; }
.answer-input:focus { box-shadow: 0 0 0 5px #8951f218; }
.is-paused::before, .is-paused::after, .is-paused :deep(.kiko-idle) { animation-play-state: paused; }
@media (hover: hover) {
  .romaji-option:not(:disabled):hover { transform: translateY(-3px); box-shadow: 0 4px 0 #ddd0fa; }
  .romaji-option:not(:disabled):active { transform: translateY(2px); box-shadow: none; }
}
@keyframes arena-arrive { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes arena-pop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
@keyframes arena-question { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes arena-drift { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(12deg); } }
@keyframes arena-breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes arena-celebrate { 0%, 100% { transform: scale(1); } 35% { transform: translateY(-7px) scale(1.07) rotate(-3deg); } 65% { transform: translateY(0) scale(.98, 1.02); } }
@keyframes arena-nudge { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 55% { transform: translateX(4px); } 80% { transform: translateX(-2px); } }
@keyframes arena-answer-pop { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.035); } }
@keyframes arena-shimmer { 0%, 25% { transform: translateX(-100%); } 75%, 100% { transform: translateX(100%); } }
@keyframes arena-particle { 0% { opacity: 0; transform: rotate(var(--angle)) translateY(-28px) scale(.3); } 20% { opacity: 1; } 100% { opacity: 0; transform: rotate(var(--angle)) translateY(-85px) rotate(70deg) scale(.7); } }
@media (max-width: 580px) {
  .arena-companion { gap: 8px; margin: -5px 0 10px; min-height: 56px; flex-wrap: wrap; }
  .arena-companion :deep(.kiko-mascot) { width: 48px; height: 48px; }
  .arena-speech { padding: 8px 10px; font-size: 11px; }
  .arena-streak { font-size: 10px; padding: 5px 7px; }
}
</style>
