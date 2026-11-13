<script setup lang="ts">
import type { Script } from '~/types/learning'
import type { CampaignInterview, CampaignTrack } from '~/types/campaign'
import { content, contentById, scriptLabels } from '~/data/content'
import { accepts } from '~/utils/learning'
import { campaignChapters, chapterQuiz, chapterUnlocked, placementState, quizScore } from '~/utils/campaign'

const store = useLearningStore()
const intro = useIntro()
const interviewOpen = ref(true)
const script = ref<Script>(store.data.value.settings.campaign?.activeScript ?? (store.data.value.settings.language === 'ko' ? 'hangul' : 'hiragana'))
const track = computed(() => store.data.value.settings.campaign?.tracks[script.value])
const chapters = computed(() => campaignChapters(script.value, content))
const placement = computed(() => track.value ? placementState(chapters.value, track.value) : undefined)
const interview = reactive<CampaignInterview>({ experience: 'new', goal: 'foundation', minutes: 10 })
const input = ref('')
const answerField = ref<HTMLInputElement>()
const showLesson = ref(Boolean(track.value?.lesson))
const resetOpen = ref(false)
const lesson = computed(() => showLesson.value ? track.value?.lesson : undefined)
const chapter = computed(() => chapters.value.find(item => item.id === lesson.value?.chapterId))
const quiz = computed(() => chapter.value ? chapterQuiz(chapter.value) : [])
const question = computed(() => !track.value?.placed ? placement.value?.next : lesson.value?.phase === 'quiz' ? quiz.value[lesson.value.answers.length] : undefined)
const score = computed(() => quizScore(lesson.value?.answers ?? []))
const passed = computed(() => score.value >= 80)
const completedCount = computed(() => chapters.value.filter(chapter => (track.value?.completed[chapter.id] ?? 0) >= 80).length)
const nextIndex = computed(() => {
  if (!track.value) return 0
  return chapters.value.findIndex((chapter, index) => index >= track.value!.startIndex && !track.value!.completed[chapter.id])
})
const allDone = computed(() => track.value?.placed && nextIndex.value === -1)
const wrongAnswers = computed(() => lesson.value?.answers.filter(answer => !answer.correct) ?? [])
const dailyChapters = computed(() => track.value?.interview.minutes === 15 ? 3 : track.value?.interview.minutes === 10 ? 2 : 1)
const goalCopy = computed(() => ({ foundation: 'Bangun fondasi, satu kelompok huruf setiap kali.', reading: 'Hubungkan huruf yang baru dikenal dengan contoh kata.', review: 'Perhatikan kembali bacaan yang masih sering tertukar.' })[track.value?.interview.goal ?? interview.goal])
const pathCards = computed(() => (['hiragana', 'katakana', 'hangul'] as const).map(id => {
  const path = campaignChapters(id, content)
  const progress = store.data.value.settings.campaign?.tracks[id]
  const completed = path.filter(chapter => (progress?.completed[chapter.id] ?? 0) >= 80).length
  const next = progress?.placed ? path.findIndex((chapter, index) => index >= progress.startIndex && !progress.completed[chapter.id]) : -1
  const savedChapter = path.findIndex(chapter => chapter.id === progress?.lesson?.chapterId)
  const current = id === script.value && showLesson.value && savedChapter >= 0
    ? savedChapter : savedChapter >= 0 && !progress?.completed[path[savedChapter]!.id] ? savedChapter : next
  return {
    id, total: path.length, completed, percent: Math.round(completed / path.length * 100),
    position: !progress ? 'Belum dimulai' : !progress.placed ? 'Tes penempatan' : current >= 0 ? `Bab ${current + 1} / ${path.length}` : 'Target jalur tuntas',
    detail: !progress ? 'Kenalan dulu bersama Kiko' : !progress.placed ? 'Temukan titik mulai belajarmu' : current >= 0 ? path[current]!.title : 'Ulangi materi atau coba jalur lain'
  }
}))

function save(next: CampaignTrack) {
  store.updateSettings({ campaign: { activeScript: script.value, tracks: { ...store.data.value.settings.campaign?.tracks, [script.value]: next } } })
}
function update(patch: Partial<CampaignTrack>) {
  if (track.value) save({ ...track.value, ...patch })
}
function startAssessment(answers: CampaignInterview) {
  Object.assign(interview, answers)
  interviewOpen.value = false
  save({ interview: { ...interview }, assessment: [], placed: false, startIndex: 0, completed: {} })
}
function chooseStart(fromZero = false) {
  update({ placed: true, startIndex: fromZero ? 0 : placement.value?.startIndex ?? 0 })
  showLesson.value = false
}
function openChapter(index: number) {
  if (!track.value || !chapterUnlocked(index, chapters.value, track.value)) return
  const target = chapters.value[index]
  if (!target) return
  if (track.value.lesson?.chapterId !== target.id) update({ lesson: { chapterId: target.id, phase: 'study', answers: [] } })
  showLesson.value = true
  input.value = ''
}
function startQuiz() {
  if (chapter.value) update({ lesson: { chapterId: chapter.value.id, phase: 'quiz', answers: [] } })
}
function studyAgain() {
  if (chapter.value) update({ lesson: { chapterId: chapter.value.id, phase: 'study', answers: [] } })
}
function answer(skip = false) {
  if (!question.value || !track.value || (!skip && !input.value.trim())) return
  const result = { itemId: question.value.id, input: skip ? '' : input.value.trim(), correct: !skip && accepts(question.value, input.value) }
  if (!track.value.placed) {
    update({ assessment: [...track.value.assessment, result] })
  } else if (lesson.value && chapter.value) {
    const answers = [...lesson.value.answers, result]
    const finished = answers.length === quiz.value.length
    const finalScore = quizScore(answers)
    update({
      lesson: { ...lesson.value, answers, phase: finished ? 'summary' : 'quiz' },
      completed: finished && finalScore >= 80
        ? { ...track.value.completed, [chapter.value.id]: Math.max(track.value.completed[chapter.value.id] ?? 0, finalScore) }
        : track.value.completed
    })
  }
  input.value = ''
  nextTick(() => answerField.value?.focus())
}
function resetPlacement() {
  if (track.value) Object.assign(interview, track.value.interview)
  const tracks = { ...store.data.value.settings.campaign?.tracks }
  delete tracks[script.value]
  store.updateSettings({ campaign: { activeScript: script.value, tracks } })
  showLesson.value = false
  resetOpen.value = false
  interviewOpen.value = true
}
watch(script, () => {
  interviewOpen.value = true
  store.updateSettings({ campaign: { activeScript: script.value, tracks: { ...store.data.value.settings.campaign?.tracks } } })
  showLesson.value = Boolean(track.value?.lesson)
  input.value = ''
})
watch(() => question.value?.id, () => nextTick(() => answerField.value?.focus()))
</script>

<template>
  <div class="journey">
    <div class="page-heading"><div><span class="eyebrow">Sedikit demi sedikit, sampai bisa</span><h1>Perjalanan Belajar</h1><p class="muted">Ada arah, ada langkah kecil, ada kemajuan.</p></div><span class="journey-emblem"><AppIcon name="target" :size="34" /></span></div>
    <div v-show="track || !interviewOpen" class="journey-paths" role="group" aria-label="Jalur belajar">
      <button v-for="path in pathCards" :key="path.id" class="journey-path-card" :data-script="path.id" :class="{ selected: script === path.id }" :aria-label="scriptLabels[path.id]" :aria-pressed="script === path.id" @click="script = path.id">
        <span class="journey-path-heading"><span class="journey-path-symbol" :lang="path.id === 'hangul' ? 'ko' : 'ja'" aria-hidden="true">{{ path.id === 'hangul' ? '한' : path.id === 'katakana' ? 'ア' : 'あ' }}</span><span><strong>{{ scriptLabels[path.id] }}</strong><small>{{ script === path.id ? 'Sedang dibuka' : 'Jalur belajar' }}</small></span><AppIcon v-if="script === path.id" name="check" :size="18" /></span>
        <span class="journey-path-position">{{ path.position }}</span><span class="journey-path-detail">{{ path.detail }}</span>
        <span class="journey-path-metrics"><span>{{ path.completed }} dari {{ path.total }} bab selesai</span><strong>{{ path.percent }}%</strong></span>
        <progress :value="path.completed" :max="path.total" :aria-label="`Progres ${scriptLabels[path.id]}`" />
      </button>
    </div>

    <template v-if="!track">
    <CampaignInterview v-if="interviewOpen && !intro.open.value" v-model:script="script" :initial-answers="interview" @draft="Object.assign(interview, $event)" @submit="startAssessment" @close="interviewOpen = false" />
    <section v-if="!interviewOpen" class="panel journey-intro">
      <span class="eyebrow">Kenalan dulu</span><h2>Kita mulai dari mana?</h2>
      <p class="muted">Kenali jalur belajarmu bersama Kiko. Jawab satu pertanyaan setiap kali, lalu coba tes singkat untuk menemukan bab pertama yang cocok.</p>
      <button class="button" style="margin-top: 24px" @click="interviewOpen = true">Mulai wawancara <AppIcon name="arrow" :size="16" /></button>
    </section>
    </template>
    <section v-else-if="!track.placed && placement?.done" class="panel journey-placement" aria-live="polite">
      <span class="journey-emblem"><AppIcon name="spark" :size="32" /></span><span class="eyebrow">Titik mulai ditemukan</span><h2>Mulai dari bab {{ placement.startIndex + 1 }}: {{ chapters[placement.startIndex]?.title }}</h2>
      <p>{{ quizScore(track.assessment) }}% jawaban benar dari {{ track.assessment.length }} soal. {{ track.interview.experience === 'new' ? 'Karena kamu ingin membangun dasar, kita mulai dari bab pertama.' : quizScore(track.assessment) === 100 ? 'Sampel bacaanmu sudah lancar. Mulai dari bab terakhir untuk menguatkan fondasi.' : 'Kita mulai dari bagian pertama yang belum konsisten, lalu lanjut sedikit demi sedikit.' }}</p>
      <p class="muted">Ini perkiraan dari sampel bacaan, bukan sertifikasi kemampuan. Bab sebelumnya tetap bisa dibuka untuk mengulang dan belum ditandai selesai.</p>
      <div class="journey-actions"><button class="button" @click="chooseStart()">Gunakan titik mulai ini <AppIcon name="arrow" :size="16" /></button><button v-if="placement.startIndex > 0" class="button secondary" @click="chooseStart(true)">Aku ingin mulai dari nol</button></div>
      <details class="journey-review"><summary>Lihat jawaban tes penempatan</summary><ul><li v-for="(result, index) in track.assessment" :key="index"><strong>{{ contentById[result.itemId]?.prompt }}</strong><span>{{ result.input || 'Belum tahu' }} → {{ contentById[result.itemId]?.answer }}</span><span>{{ result.correct ? 'Benar' : 'Perlu dipelajari' }}</span></li></ul></details>
    </section>

    <section v-else-if="question" class="panel journey-test">
      <div class="journey-between"><span class="eyebrow">{{ track.placed ? 'Kuis bab · target 80%' : '02 / Tes penempatan' }}</span><button v-if="track.placed" class="text-button" @click="showLesson = false">Kembali ke peta</button></div>
      <h2>{{ track.placed ? chapter?.title : 'Coba baca yang ini' }}</h2>
      <p class="muted">{{ track.placed ? `Soal ${(lesson?.answers.length ?? 0) + 1} dari ${quiz.length}` : `Soal ${track.assessment.length + 1} · maksimal ${placement?.total} soal` }} · Tanpa batas waktu</p>
      <progress :value="track.placed ? lesson?.answers.length : track.assessment.length" :max="track.placed ? quiz.length : placement?.total" aria-label="Kemajuan soal" />
      <div class="journey-prompt"><span :lang="question.language">{{ question.prompt }}</span><small v-if="script === 'hangul' && question.kind === 'letter'">Baca bunyi blok ini, bukan nama hurufnya.</small></div>
      <form class="journey-answer" @submit.prevent="answer()"><label for="journey-answer">Ketik bacaannya dengan huruf Latin</label><input id="journey-answer" ref="answerField" v-model="input" autocomplete="off" autocapitalize="off" :spellcheck="false" maxlength="100" placeholder="Bacaanmu…"><div class="journey-actions"><button class="button" type="submit" :disabled="!input.trim()">Kirim jawaban <AppIcon name="arrow" :size="16" /></button><button class="button secondary" type="button" @click="answer(true)">Belum tahu</button></div></form>
      <p class="journey-footnote muted">{{ track.placed ? 'Pembahasan dan jawaban akan muncul di rangkuman setelah kuis.' : 'Jawab sesuai yang kamu ingat. Hasil dan jawaban muncul setelah tes selesai.' }}</p>
    </section>

    <template v-else-if="track.placed && chapter && lesson">
      <div class="journey-between"><button class="text-button" @click="showLesson = false">← Peta perjalanan</button><span class="muted">Bab {{ chapters.findIndex(item => item.id === chapter?.id) + 1 }} / {{ chapters.length }}</span></div>
      <section v-if="lesson.phase === 'study'" class="panel journey-study">
        <span class="eyebrow">Kenali → baca → uji → rangkum</span><h2>{{ chapter.title }}</h2><p class="muted">{{ goalCopy }} Pelajari {{ chapter.items.length }} huruf ini sebelum mengerjakan kuis.</p>
        <div class="journey-note"><AppIcon name="book" /><p>{{ script === 'hangul' ? 'Hangul disusun menjadi blok suku kata. Di kartu ini, kenali hurufnya lalu baca contoh blok di sebelahnya. Kuis menanyakan bacaan blok tersebut.' : `Satu kartu mengenalkan satu bunyi ${scriptLabels[script]}. Lihat bentuknya, sebutkan bacaannya, lalu coba ingat kembali tanpa melihat jawaban.` }}</p></div>
        <div class="journey-cards"><article v-for="item in chapter.items" :key="item.id" class="journey-card"><span class="journey-glyph" :lang="item.language">{{ item.glyph }}</span><strong>{{ script === 'hangul' ? `${item.prompt} → ${item.answer}` : item.answer }}</strong><small v-if="item.letterName">Nama huruf: {{ item.letterName }}</small><p>{{ item.note }}</p><NuxtLink :to="`/materi/${encodeURIComponent(item.id)}`" class="text-link">Lihat kartu detail <AppIcon name="arrow" :size="13" /></NuxtLink></article></div>
        <div v-if="chapter.words.length" class="journey-word-section"><h3>Satukan menjadi kata</h3><p class="muted">Kata-kata ini memakai huruf dari bab ini dan bab sebelumnya.</p><div class="journey-words"><div v-for="word in chapter.words" :key="word.id"><strong :lang="word.language">{{ word.glyph }}</strong><span>{{ word.answer }}</span><small>{{ word.meaning }}</small><p>{{ word.note }}</p></div></div></div>
        <div class="journey-note"><AppIcon name="target" /><p>Kuis berisi {{ quiz.length }} soal. Raih minimal 80% untuk membuka bab berikutnya. Kamu boleh mengulang sebanyak yang diperlukan.</p></div><button class="button" @click="startQuiz">Sudah dipelajari, mulai kuis <AppIcon name="arrow" :size="16" /></button>
      </section>
      <section v-else-if="lesson.phase === 'summary'" class="panel journey-summary" aria-live="polite">
        <span class="eyebrow">Rangkuman bab</span><div class="journey-between"><h2>{{ passed ? 'Satu langkah lagi dikuasai!' : 'Pelan-pelan, kita kuatkan dulu' }}</h2><strong class="journey-score">{{ score }}%</strong></div><p>{{ passed ? 'Bab ini selesai. Kamu siap melanjutkan perjalanan.' : 'Target bab ini 80%. Baca kembali bagian yang belum tepat, lalu coba kuis lagi.' }}</p>
        <div class="journey-recap"><h3>Yang baru kamu pelajari</h3><p>{{ chapter.items.map(item => `${item.glyph} (${item.answer})`).join(' · ') }}</p><p v-if="chapter.words.length">Contoh kata: {{ chapter.words.map(item => `${item.glyph} = ${item.meaning}`).join(' · ') }}</p></div>
        <div v-if="wrongAnswers.length" class="journey-recap"><h3>Bagian yang perlu diulang</h3><ul class="journey-corrections"><li v-for="(result, index) in wrongAnswers" :key="index"><strong>{{ contentById[result.itemId]?.prompt }} → {{ contentById[result.itemId]?.answer }}</strong><span class="muted">Jawabanmu: {{ result.input || 'Belum tahu' }}</span><p>{{ contentById[result.itemId]?.note }}</p></li></ul></div>
        <p v-else class="journey-note">Semua jawaban benar. Coba baca sekali lagi tanpa melihat romanisasinya.</p>
        <div class="journey-actions"><button v-if="passed && nextIndex >= 0" class="button" @click="openChapter(nextIndex)">Lanjut ke bab berikutnya <AppIcon name="arrow" :size="16" /></button><button v-else-if="passed" class="button" @click="showLesson = false">Lihat perjalanan selesai <AppIcon name="check" :size="16" /></button><button v-else class="button" @click="studyAgain">Pelajari lagi</button><button class="button secondary" @click="startQuiz">Ulangi kuis</button></div>
      </section>
    </template>

    <template v-else-if="track.placed">
      <section class="journey-hero"><div><span class="eyebrow">{{ allDone ? 'Bab dari titik mulamu tuntas' : 'Jalur belajarmu' }}</span><h2>{{ allDone ? `Perjalanan ${scriptLabels[script]} tuntas!` : 'Satu bab kecil hari ini?' }}</h2><p>{{ goalCopy }}</p><p class="muted">Rencana {{ track.interview.minutes }} menit: coba {{ dailyChapters }} bab per hari. Sesuaikan dengan ritmemu.</p></div><span class="journey-hero-glyph" :lang="script === 'hangul' ? 'ko' : 'ja'">{{ script === 'hangul' ? '한' : script === 'katakana' ? 'ア' : 'あ' }}</span>
        <div class="journey-progress"><div class="journey-between"><strong>{{ completedCount }} / {{ chapters.length }} bab selesai</strong><span>{{ track.startIndex ? `${track.startIndex} bab sebelum titik mulai` : 'Mulai dari fondasi' }}</span></div><progress :value="completedCount" :max="chapters.length" aria-label="Bab selesai" /></div>
        <div class="journey-actions"><button v-if="!allDone" class="button" @click="openChapter(nextIndex)">{{ track.lesson?.phase === 'quiz' && track.lesson.chapterId === chapters[nextIndex]?.id ? 'Lanjutkan kuis' : 'Lanjutkan belajar' }} <AppIcon name="arrow" :size="16" /></button><NuxtLink v-else to="/latihan" class="button">Lanjut latihan bebas <AppIcon name="play" :size="16" /></NuxtLink><button class="text-button" @click="resetOpen = true">Atur ulang penempatan</button></div>
      </section>
      <div v-if="allDone" class="journey-note"><AppIcon name="star" /><p>Kamu telah menyelesaikan bab dari titik mulamu. Ulangi bab sebelumnya, coba jalur tulisan lain, atau lanjutkan latihan bebas. Jalur ini mencakup materi huruf dan kata yang tersedia di KanaLearn, bukan seluruh kemampuan bahasa.</p></div>
      <div class="section-title"><h2>Peta bab {{ scriptLabels[script] }}</h2><span class="muted">Materi · kuis · rangkuman</span></div>
      <ol class="journey-map"><li v-for="(item, index) in chapters" :key="item.id"><button class="journey-chapter" :class="{ current: index === nextIndex, complete: track.completed[item.id], locked: !chapterUnlocked(index, chapters, track) }" :disabled="!chapterUnlocked(index, chapters, track)" @click="openChapter(index)"><span class="journey-number"><AppIcon v-if="track.completed[item.id]" name="check" :size="20" /><span v-else>{{ index + 1 }}</span></span><span class="journey-chapter-copy"><strong>{{ item.title }}</strong><small>{{ item.items.map(letter => letter.glyph).join(' ') }} · {{ item.items.length }} huruf{{ item.words.length ? ` + ${item.words.length} kata` : '' }}</small></span><span class="journey-status">{{ track.completed[item.id] ? `Selesai · ${track.completed[item.id]}%` : index < track.startIndex ? 'Bisa diulang' : index === nextIndex ? 'Mulai di sini' : chapterUnlocked(index, chapters, track) ? 'Terbuka' : 'Terkunci' }}</span><AppIcon name="arrow" :size="16" /></button></li></ol>
      <p class="journey-footnote muted">Progres tersimpan di browser ini dan ikut dalam ekspor data di Pengaturan. Progres perjalanan dihitung dari kuis bab, terpisah dari statistik latihan bebas.</p>
    </template>
    <ConfirmDialog :open="resetOpen" title="Atur ulang jalur ini?" confirm-label="Ulangi penempatan" @cancel="resetOpen = false" @confirm="resetPlacement"><p>Wawancara, hasil tes, dan progres bab {{ scriptLabels[script] }} akan dihapus. Jalur lain dan riwayat latihan tetap tersimpan.</p></ConfirmDialog>
  </div>
</template>

<style scoped>
.journey { max-width: 1040px; margin: auto; }
.journey .page-heading p { margin-top: 8px; }
.journey-emblem { display: inline-flex; align-items: center; justify-content: center; color: var(--accent); background: var(--accent-light); width: 68px; height: 68px; border-radius: 22px; flex-shrink: 0; }
.journey-paths { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 28px; }
.journey-path-card { --path-color: #8054ee; --path-ink: color-mix(in srgb, var(--path-color) 75%, var(--ink)); --path-border: color-mix(in srgb, var(--path-color) 40%, var(--line)); position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; min-width: 0; padding: 22px; border: 2px solid var(--path-border); border-radius: 20px; background: linear-gradient(135deg, color-mix(in srgb, var(--path-color) 15%, var(--surface)), color-mix(in srgb, var(--path-color) 5%, var(--surface))); color: var(--ink); text-align: left; box-shadow: 0 4px var(--path-border); }
.journey-path-card[data-script='katakana'] { --path-color: #ee824c; }
.journey-path-card[data-script='hangul'] { --path-color: #18a89c; }
.journey-path-card::before { content: ''; position: absolute; width: 150px; height: 150px; top: -80px; right: -50px; border: 22px solid color-mix(in srgb, var(--path-color) 14%, transparent); border-radius: 50%; z-index: -1; pointer-events: none; }
.journey-path-card:hover { border-color: var(--path-color); transform: translateY(-2px); box-shadow: 0 6px var(--path-border); }
.journey-path-card.selected { border-color: var(--path-color); background: linear-gradient(135deg, color-mix(in srgb, var(--path-color) 24%, var(--surface)), color-mix(in srgb, var(--path-color) 10%, var(--surface))); box-shadow: 0 5px var(--path-color); }
.journey-path-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.journey-path-heading > span:nth-child(2) { min-width: 0; flex: 1; }
.journey-path-heading strong { display: block; font-size: 17px; color: var(--path-ink); }
.journey-path-heading small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
.journey-path-heading > svg { color: var(--surface); background: var(--path-color); border-radius: 50%; padding: 3px; width: 24px; height: 24px; flex-shrink: 0; }
.journey-path-symbol { display: grid; place-items: center; width: 46px; height: 48px; flex-shrink: 0; border: 1px solid color-mix(in srgb, var(--path-color) 55%, var(--surface)); border-radius: 14px; background: color-mix(in srgb, var(--path-color) 23%, var(--surface)); color: var(--path-ink); font-size: 30px; box-shadow: 0 3px color-mix(in srgb, var(--path-color) 35%, var(--surface)); rotate: -5deg; }
.selected .journey-path-symbol { background: var(--path-color); color: white; border-color: var(--path-color); box-shadow: 0 3px var(--path-ink); }
.journey-path-position { font-size: 18px; font-weight: 750; letter-spacing: -.4px; }
.journey-path-detail { font-size: 12px; color: var(--muted); line-height: 1.6; margin-top: 5px; margin-bottom: 20px; }
.journey-path-metrics { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--muted); margin-top: auto; }
.journey-path-metrics strong { color: var(--path-ink); }
.journey .journey-path-card progress { height: 8px; margin-top: 10px; background: color-mix(in srgb, var(--path-color) 16%, var(--surface)); }
.journey .journey-path-card progress::-webkit-progress-bar { background: color-mix(in srgb, var(--path-color) 16%, var(--surface)); }
.journey .journey-path-card progress::-webkit-progress-value { background: var(--path-color); }
.journey .journey-path-card progress::-moz-progress-bar { background: var(--path-color); }
.journey .panel { background: var(--surface); }
.journey-intro { max-width: 800px; }
.journey-intro > p, .journey-study > p, .journey-placement > p { margin-top: 12px; }
.journey-interview { margin-top: 28px; display: grid; gap: 24px; }
.journey-interview fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 10px; }
.journey-interview legend { font-weight: 700; margin-bottom: 12px; }
.journey-option { display: flex; align-items: center; gap: 14px; border: 2px solid var(--line); border-radius: 14px; padding: 16px; cursor: pointer; background: var(--surface-soft); }
.journey-option.picked { border-color: var(--accent); background: var(--accent-light); }
.journey-option input { accent-color: var(--accent); width: 18px; height: 18px; flex-shrink: 0; }
.journey-option small { display: block; margin-top: 5px; color: var(--muted); line-height: 1.6; }
.journey-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.journey-note { display: flex; align-items: flex-start; gap: 12px; background: var(--accent-light); border-radius: 14px; padding: 17px; line-height: 1.8; margin: 20px 0; }
.journey-note svg { flex-shrink: 0; color: var(--accent); margin-top: 3px; }
.journey-interview .journey-note { margin: 0; }
.journey-interview > .button { justify-self: start; }
.journey-between { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.journey-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 24px; }
.journey-test { max-width: 700px; margin: auto; }
.journey progress { display: block; appearance: none; width: 100%; height: 10px; border: 0; border-radius: 10px; background: var(--line); overflow: hidden; margin-top: 18px; }
.journey progress::-webkit-progress-bar { background: var(--line); border-radius: 10px; }
.journey progress::-webkit-progress-value { background: var(--accent); border-radius: 10px; }
.journey progress::-moz-progress-bar { background: var(--accent); }
.journey-prompt { display: grid; justify-items: center; padding: 36px 12px; gap: 16px; }
.journey-prompt > span { font-size: clamp(64px, 12vw, 100px); line-height: 1.4; overflow-wrap: anywhere; }
.journey-prompt small { color: var(--muted); text-align: center; }
.journey-answer { display: grid; gap: 10px; }
.journey-answer > label { font-weight: 650; }
.journey-answer > input { width: 100%; border: 2px solid var(--line); border-radius: 12px; background: var(--surface-soft); color: var(--ink); padding: 16px; font-size: 20px; }
.journey-answer .journey-actions { margin-top: 8px; }
.journey-footnote { margin-top: 24px; font-size: 12px; }
.journey-placement { max-width: 760px; }
.journey-placement .journey-emblem { margin-bottom: 24px; }
.journey-review { margin-top: 28px; }
.journey-review summary { cursor: pointer; font-weight: 650; }
.journey-review ul { padding: 0; list-style: none; }
.journey-review li { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.journey-study, .journey-summary { margin-top: 20px; }
.journey-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 14px; margin: 24px 0; }
.journey-card { border: 1px solid var(--line); border-radius: 16px; padding: 18px; display: flex; align-items: center; flex-direction: column; gap: 10px; background: var(--surface-soft); text-align: center; }
.journey-glyph { font-size: 48px; color: var(--accent); line-height: 1.4; }
.journey-card small, .journey-card p { font-size: 12px; color: var(--muted); }
.journey-card .text-link { margin-top: auto; font-size: 12px; }
.journey-word-section { border-top: 1px solid var(--line); padding-top: 24px; }
.journey-words { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-top: 16px; }
.journey-words > div { display: grid; gap: 6px; padding: 16px; border-radius: 12px; background: var(--surface-soft); }
.journey-words strong { font-size: 26px; }
.journey-words small, .journey-words p { color: var(--muted); font-size: 12px; }
.journey-score { color: var(--accent); font-size: 44px; }
.journey-recap { margin: 24px 0; border-top: 1px solid var(--line); padding-top: 20px; }
.journey-recap p { margin-top: 10px; }
.journey-corrections { padding: 0; list-style: none; }
.journey-corrections li { padding: 14px 0; display: grid; gap: 5px; border-bottom: 1px solid var(--line); }
.journey-hero { background: var(--accent-light); border: 1px solid var(--line); border-radius: 22px; padding: 30px; position: relative; margin-bottom: 28px; overflow: hidden; }
.journey-hero > div:first-child { max-width: 80%; }
.journey-hero p { margin-top: 8px; }
.journey-hero-glyph { position: absolute; right: 26px; top: 20px; color: var(--accent); font-size: 92px; opacity: .22; }
.journey-progress { margin-top: 26px; }
.journey-progress .journey-between { font-size: 12px; }
.journey-map { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 12px; }
.journey-chapter { display: flex; align-items: center; gap: 16px; width: 100%; text-align: left; padding: 20px; border: 2px solid var(--line); border-radius: 16px; background: var(--surface); color: var(--ink); }
.journey-chapter:not(:disabled):hover { border-color: var(--accent); }
.journey-chapter.current { border-color: var(--accent); background: var(--accent-light); }
.journey-chapter.complete .journey-number { background: var(--green); color: var(--surface); }
.journey-chapter.locked { opacity: .65; }
.journey-number { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; background: var(--accent-light); color: var(--accent); font-weight: 750; flex-shrink: 0; }
.journey-chapter-copy { display: grid; gap: 6px; flex: 1; min-width: 0; }
.journey-chapter-copy small { color: var(--muted); line-height: 1.6; }
.journey-status { font-size: 11px; color: var(--muted); }
@media (max-width: 680px) {
  .journey-paths { grid-template-columns: 1fr; gap: 12px; }
  .journey-path-card { display: grid; grid-template-columns: 1fr auto; column-gap: 14px; padding: 16px; border-radius: 16px; }
  .journey-path-heading { grid-row: span 2; margin-bottom: 12px; }
  .journey-path-heading > svg { display: none; }
  .journey-path-position { font-size: 14px; text-align: right; align-self: end; }
  .journey-path-detail { margin: 4px 0 12px; font-size: 11px; text-align: right; }
  .journey-path-metrics, .journey .journey-path-card progress { grid-column: 1 / -1; }
  .journey .page-heading > .journey-emblem { display: none; }
  .journey-fields { grid-template-columns: 1fr; }
  .journey-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .journey-card { padding: 14px 10px; }
  .journey-chapter { padding: 14px 10px; gap: 10px; flex-wrap: wrap; }
  .journey-status { width: 100%; padding-left: 52px; }
  .journey-chapter > svg { display: none; }
  .journey-hero { padding: 22px; }
  .journey-hero > div:first-child { max-width: 100%; position: relative; z-index: 1; }
  .journey-hero-glyph { opacity: .1; }
}
</style>
