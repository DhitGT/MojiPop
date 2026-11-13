import { test } from 'node:test'
import assert from 'node:assert/strict'
import { content } from '../app/data/content.ts'
import { campaignChapters, chapterQuiz, placementBlocks, placementState, chapterUnlocked, validCampaign } from '../app/utils/campaign.ts'
import { emptyProgress, validateImport } from '../app/utils/storage.ts'

const fresh = () => ({ interview: { experience: 'some', goal: 'reading', minutes: 10 }, assessment: [], placed: false, startIndex: 0, completed: {} })

test('all paths introduce every letter once and only use words with known prerequisites', () => {
  for (const script of ['hiragana', 'katakana', 'hangul']) {
    const chapters = campaignChapters(script, content)
    const known = new Set()
    for (const chapter of chapters) {
      assert.ok(chapter.items.length > 0 && chapter.items.length <= 5)
      chapter.items.forEach(item => { assert.ok(!known.has(item.id)); known.add(item.id) })
      chapter.words.forEach(word => assert.ok(word.prerequisites.every(id => known.has(id))))
      assert.ok(chapterQuiz(chapter).length <= 8)
    }
    assert.equal(known.size, content.filter(item => item.script === script && item.kind === 'letter').length)
    if (script === 'hangul') assert.match(chapters[0].title, /Vokal/)
  }
})

test('placement stops at first weak block, keeps beginners at zero, and never marks chapters complete', () => {
  const chapters = campaignChapters('hiragana', content)
  const blocks = placementBlocks(chapters)
  const track = fresh()
  assert.equal(placementState(chapters, track).done, false)
  const answers = correct => blocks[0].items.map(item => ({ itemId: item.id, input: '', correct }))
  track.assessment = answers(false)
  assert.equal(placementState(chapters, track).startIndex, 0)
  assert.equal(placementState(chapters, track).done, true)
  track.assessment = answers(true)
  assert.equal(placementState(chapters, track).done, false)
  assert.equal(placementState(chapters, track).startIndex, blocks[1].startIndex)
  track.interview.experience = 'new'
  assert.equal(placementState(chapters, track).done, true)
  assert.equal(placementState(chapters, track).startIndex, 0)
  track.interview.experience = 'confident'
  track.assessment = blocks.flatMap(block => block.items.map(item => ({ itemId: item.id, input: item.answer, correct: true })))
  assert.equal(placementState(chapters, track).startIndex, chapters.length - 1)
  assert.deepEqual(track.completed, {})
})

test('chapter gates require contiguous passes from placement while allowing earlier reviews', () => {
  const chapters = campaignChapters('hiragana', content)
  const track = { ...fresh(), placed: true, startIndex: 2 }
  assert.equal(chapterUnlocked(0, chapters, track), true)
  assert.equal(chapterUnlocked(2, chapters, track), true)
  assert.equal(chapterUnlocked(3, chapters, track), false)
  track.completed[chapters[2].id] = 80
  assert.equal(chapterUnlocked(3, chapters, track), true)
  assert.equal(chapterUnlocked(4, chapters, track), false)
})

test('campaign backups round trip, old backups work, and malformed campaign data is rejected', () => {
  const known = new Set(content.map(item => item.id))
  const backup = emptyProgress()
  assert.deepEqual(validateImport(JSON.stringify(backup), known), backup)
  backup.settings.campaign = { tracks: { hiragana: fresh() } }
  assert.deepEqual(validateImport(JSON.stringify(backup), known), backup)
  for (const invalid of [null, [], { tracks: { other: fresh() } }, { tracks: { hiragana: { ...fresh(), lesson: null } } }, { tracks: { hiragana: { ...fresh(), interview: null } } }, { tracks: { hiragana: { ...fresh(), startIndex: 99 } } }, { tracks: { hiragana: { ...fresh(), placed: true } } }]) {
    assert.ok(!validCampaign(invalid, content))
    backup.settings.campaign = invalid
    assert.throws(() => validateImport(JSON.stringify(backup), known))
  }
})

test('assessment drafts and every lesson phase survive a backup for all scripts', () => {
  for (const script of ['hiragana', 'katakana', 'hangul']) {
    const chapters = campaignChapters(script, content)
    const track = { ...fresh(), interview: { ...fresh().interview, experience: 'new' } }
    const data = { activeScript: script, tracks: { [script]: track } }
    const samples = placementBlocks(chapters)[0].items
    for (const item of samples) {
      track.assessment.push({ itemId: item.id, input: '', correct: false })
      assert.equal(validCampaign(data, content), true)
    }
    track.placed = true
    track.lesson = { chapterId: chapters[0].id, phase: 'study', answers: [] }
    assert.equal(validCampaign(data, content), true)
    track.lesson.phase = 'quiz'
    const quiz = chapterQuiz(chapters[0])
    for (const item of quiz.slice(0, -1)) {
      track.lesson.answers.push({ itemId: item.id, input: item.answer, correct: true })
      assert.equal(validCampaign(data, content), true)
    }
    track.lesson.answers.push({ itemId: quiz.at(-1).id, input: quiz.at(-1).answer, correct: true })
    track.lesson.phase = 'summary'
    track.completed[chapters[0].id] = 100
    assert.equal(validCampaign(data, content), true)
    const backup = emptyProgress()
    backup.settings.campaign = data
    assert.deepEqual(validateImport(JSON.stringify(backup), new Set(content.map(item => item.id))), backup)
  }
})
