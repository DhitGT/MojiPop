import type { ContentItem, Script } from '../types/learning'
import type { CampaignTrack } from '../types/campaign'
import { studyPath, wordsForStep } from './curriculum.ts'

export interface CampaignChapter {
  id: string
  title: string
  items: ContentItem[]
  words: ContentItem[]
}

// Small chapters introduce vowels first, then build a vocabulary from known letters.
export function campaignChapters(script: Script, content: ContentItem[]): CampaignChapter[] {
  const steps = studyPath(script, content)
  return steps.map(step => ({ id: step.id, title: step.title, items: step.items, words: wordsForStep(step.id, steps, content).slice(0, 3) }))
}

// Three samples from each of four consecutive blocks. Stop at the first gap.
// Placement is a recommendation from a sample, never a chapter completion.
export function placementBlocks(chapters: CampaignChapter[]) {
  const size = Math.ceil(chapters.length / 4)
  const blocks: { startIndex: number; items: ContentItem[] }[] = []
  for (let start = 0; start < chapters.length; start += size) {
    const items = chapters.slice(start, start + size).flatMap(chapter => chapter.items)
    blocks.push({ startIndex: start, items: [items[0]!, items[Math.floor(items.length / 2)]!, items.at(-1)!] })
  }
  return blocks
}

export function placementState(chapters: CampaignChapter[], track: CampaignTrack) {
  const blocks = placementBlocks(chapters)
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]!
    const answers = track.assessment.slice(index * 3, index * 3 + 3)
    if (answers.length < 3) return { done: false, startIndex: block.startIndex, next: block.items[answers.length]!, total: blocks.length * 3 }
    if (answers.some(answer => !answer.correct) || track.interview.experience === 'new') {
      return { done: true, startIndex: block.startIndex, next: undefined, total: blocks.length * 3 }
    }
  }
  // Even a perfect placement leaves the final chapter for consolidation.
  return { done: true, startIndex: Math.max(0, chapters.length - 1), next: undefined, total: blocks.length * 3 }
}

export const chapterQuiz = (chapter: CampaignChapter) => [...chapter.items, ...chapter.words]
export function quizScore(answers: { correct: boolean }[]) {
  return answers.length ? Math.round(answers.filter(answer => answer.correct).length / answers.length * 100) : 0
}

export function chapterUnlocked(index: number, chapters: CampaignChapter[], track: CampaignTrack) {
  return index <= track.startIndex || chapters.slice(track.startIndex, index).every(chapter => (track.completed[chapter.id] ?? 0) >= 80)
}

export function validCampaign(value: unknown, content?: ContentItem[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const activeScript = (value as { activeScript?: unknown }).activeScript
  if (activeScript !== undefined && !['hiragana', 'katakana', 'hangul'].includes(String(activeScript))) return false
  const tracks = (value as { tracks?: unknown }).tracks
  if (!tracks || typeof tracks !== 'object' || Array.isArray(tracks)) return false
  const validAnswers = (answers: unknown, max: number) => Array.isArray(answers) && answers.length <= max && answers.every(answer =>
    answer && typeof answer.itemId === 'string' && answer.itemId.length <= 100
    && typeof answer.input === 'string' && answer.input.length <= 100 && typeof answer.correct === 'boolean')
  return Object.entries(tracks).length <= 3 && Object.entries(tracks).every(([script, track]) => {
    if (!['hiragana', 'katakana', 'hangul'].includes(script) || !track || typeof track !== 'object') return false
    const t = track as CampaignTrack
    const valid = t.interview && ['new', 'some', 'confident'].includes(t.interview.experience)
      && ['foundation', 'reading', 'review'].includes(t.interview.goal) && [5, 10, 15].includes(t.interview.minutes)
      && validAnswers(t.assessment, 12) && typeof t.placed === 'boolean'
      && Number.isInteger(t.startIndex) && t.startIndex >= 0 && t.startIndex < 100
      && t.completed && typeof t.completed === 'object' && !Array.isArray(t.completed)
      && Object.entries(t.completed).length <= 100 && Object.entries(t.completed).every(([id, score]) =>
        id.length <= 100 && Number.isInteger(score) && score >= 80 && score <= 100)
      && (t.lesson === undefined || (t.lesson && typeof t.lesson === 'object' && typeof t.lesson.chapterId === 'string' && t.lesson.chapterId.length <= 100
        && ['study', 'quiz', 'summary'].includes(t.lesson.phase) && validAnswers(t.lesson.answers, 12)))
    if (!valid || !content) return Boolean(valid)
    const chapters = campaignChapters(script as Script, content)
    if (t.startIndex >= chapters.length || Object.keys(t.completed).some(id => !chapters.some(chapter => chapter.id === id))) return false
    const assessmentItems = placementBlocks(chapters).flatMap(block => block.items)
    if (t.assessment.some((answer, index) => answer.itemId !== assessmentItems[index]?.id)) return false
    if (t.placed && !placementState(chapters, t).done) return false
    if (t.lesson) {
      const chapter = chapters.find(chapter => chapter.id === t.lesson!.chapterId)
      if (!t.placed || !chapter) return false
      const quiz = chapterQuiz(chapter)
      if (t.lesson.answers.some((answer, index) => answer.itemId !== quiz[index]?.id)) return false
      if (t.lesson.phase === 'study' && t.lesson.answers.length !== 0) return false
      if (t.lesson.phase === 'quiz' && t.lesson.answers.length >= quiz.length) return false
      if (t.lesson.phase === 'summary' && t.lesson.answers.length !== quiz.length) return false
    }
    return true
  })
}
