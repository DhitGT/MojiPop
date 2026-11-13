<script setup lang="ts">
import { scriptLabels, modeLabels } from '~/data/content'
import { duration, summarize } from '~/utils/learning'
const store = useLearningStore()
const route = useRoute()
const session = computed(() => store.data.value.sessions.find(session => session.id === String(route.query.id)))
const { input, assisted, feedback, elapsed, promptReady, inputElement, choiceElement, choices, choose, current, paused, submit, hint, next, pause, resume, finish } = usePractice(session)
const isChoice = computed(() => session.value?.config.answerFormat === 'choice')
const summary = computed(() => session.value ? summarize(session.value) : null)
const feedbackLabel = computed(() => feedback.value?.outcome === 'correct' ? 'Benar' : feedback.value?.outcome === 'skipped' ? 'Dilewati' : feedback.value?.outcome === 'assisted' ? 'Dibantu' : 'Belum tepat')
function keydown(event: KeyboardEvent) {
  if (isChoice.value && /^[1-4]$/.test(event.key)) {
    const answer = choices.value[Number(event.key) - 1]
    if (answer) { event.preventDefault(); choose(answer) }
  }
  if (event.key === 'Enter' && feedback.value && feedback.value.outcome !== 'correct') { event.preventDefault(); void next() }
}
</script>

<template>
  <div v-if="session && current" @keydown="keydown">
    <div class="arena-top"><div><span class="pill">{{ scriptLabels[session.config.script] }}</span><span class="pill green">{{ modeLabels[session.config.mode] }}</span></div><button v-if="!paused" class="text-button" @click="pause"><AppIcon name="pause" :size="16" /> Jeda</button><NuxtLink v-else to="/latihan" class="text-link">Keluar</NuxtLink></div>
    <section v-if="paused" class="panel pause-cover" aria-labelledby="pause-title"><AppIcon name="pause" :size="36" /><h1 id="pause-title">Sesi dijeda</h1><p>Soal diganti saat lanjut. Progres tetap tersimpan.</p><div class="button-row"><button class="button" @click="resume">Lanjutkan sesi <AppIcon name="play" :size="16" /></button><button class="button secondary" @click="finish()">Akhiri sesi</button></div></section>
    <section v-else class="panel arena-card" aria-label="Soal latihan">
      <div class="arena-meta"><span>{{ session.config.count ? `${Math.min(session.attempts.length + (feedback ? 0 : 1), session.config.count)} / ${session.config.count}` : `${session.attempts.length} terjawab` }}</span><span class="arena-timer" :role="session.config.mode === 'sprint' ? 'timer' : undefined">{{ session.config.mode === 'sprint' ? `${Math.max(0, Math.ceil((60000 - elapsed) / 1000))} dtk` : duration(elapsed) }}</span></div>
      <div v-if="session.config.count" class="progress-bar"><span :style="{ width: `${session.attempts.length / session.config.count * 100}%` }" /></div>
      <div class="arena-prompt" :lang="current.language" aria-label="Karakter untuk dibaca">{{ current.prompt }}</div>
      <div v-if="isChoice" ref="choiceElement" class="romaji-choices" role="group" aria-label="Pilihan romaji">
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
