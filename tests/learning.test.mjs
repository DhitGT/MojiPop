import { test } from 'node:test'
import assert from 'node:assert/strict'
import { content, contentById, confusionGroups, CONTENT_VERSION } from '../app/data/content.ts'
import { accepts, makeChoices, makeAttempt, makeQueue, selectPool, summarize, itemProgress, detectConfusion, comparisonKey, isNewRecord, chronologicalAttempts } from '../app/utils/learning.ts'
import { emptyProgress, validateImport, validConfig } from '../app/utils/storage.ts'
import { studyPath, wordsForStep } from '../app/utils/curriculum.ts'
import { practicePackages } from '../app/data/practicePackages.ts'

const config = (overrides = {}) => ({ language: 'ja', script: 'hiragana', kind: 'letter', group: 'Vokal', mode: 'relaxed', count: 10, source: 'random', itemIds: [], reviewIds: [], ...overrides })
function session(overrides = {}) {
  return { id: 'session-1', config: config(), contentVersion: CONTENT_VERSION, device: 'keyboard', startedAt: '2026-11-13T03:00:00Z', activeMs: 10000, status: 'active', hasPaused: false, attempts: [], queue: Array(10).fill('hiragana:あ'), cursor: 0, unfinished: 0, ...overrides }
}
const attempt = (s, id, input, options = {}) => makeAttempt(s, contentById[id], input, options.assisted || false, options.skipped || false, options.ms ?? 1000)

test('ready-made packages have valid, nonempty pools and keep beginner lessons focused', () => {
  for (const language of ['ja', 'ko']) {
    const packages = practicePackages(language)
    assert.equal(new Set(packages.map(pack => pack.id)).size, packages.length)
    for (const pack of packages) {
      assert.ok(validConfig(pack.config), pack.id)
      assert.ok(selectPool(pack.config, content).length, pack.id)
      assert.equal(pack.config.language, language)
      assert.ok(['starter', 'letters', 'words', 'challenge'].includes(pack.category))
    }
    assert.equal(selectPool(packages[0].config, content).length, 5)
    assert.ok(packages.some(pack => pack.config.kind === 'word'))
    assert.ok(packages.some(pack => pack.config.answerFormat === 'typing'))
    assert.ok(packages.length >= 17)
    assert.equal(new Set(packages.map(pack => pack.category)).size, 4)
  }
})

test('choice answers are unique and contain exactly one accepted answer for every item', () => {
  for (const item of content) {
    const choices = makeChoices(item, content)
    assert.equal(choices.length, 4, item.id)
    assert.equal(new Set(choices).size, 4, item.id)
    assert.deepEqual(choices.filter(answer => accepts(item, answer)), [item.answer], item.id)
    assert.ok(choices.every(answer => content.some(candidate => candidate.script === item.script && candidate.kind === item.kind && candidate.answer === answer)))
  }
  assert.deepEqual(makeChoices(content[0], [content[0]]), [content[0].answer])
})

test('choice records stay separate while old typing configs and imports remain valid', () => {
  assert.ok(validConfig(config()))
  assert.ok(validConfig(config({ answerFormat: 'choice' })))
  assert.ok(!validConfig(config({ answerFormat: 'invalid' })))
  assert.equal(comparisonKey(session()), comparisonKey(session({ config: config({ answerFormat: 'typing' }) })))
  assert.notEqual(comparisonKey(session()), comparisonKey(session({ config: config({ answerFormat: 'choice' }) })))
})

test('content has stable unique IDs, full basic kana, and the required draft word pools', () => {
  assert.equal(new Set(content.map(item => item.id)).size, content.length)
  for (const script of ['hiragana', 'katakana']) {
    assert.equal(content.filter(item => item.script === script && item.kind === 'letter' && !/Dakuten|Handakuten|Kombinasi/.test(item.group)).length, 46)
  }
  assert.ok(content.filter(item => item.language === 'ja' && item.kind === 'word').length >= 60)
  assert.ok(content.filter(item => item.language === 'ko' && item.kind === 'word').length >= 20)
  assert.equal(content.filter(item => item.group === 'Konsonan dasar').length, 14)
  assert.equal(content.filter(item => item.group === 'Vokal dasar').length, 10)
  for (const item of content) {
    assert.ok(item.source.startsWith('https://'))
    assert.ok(item.prerequisites.every(id => contentById[id]), item.id)
    assert.ok(accepts(item, item.answer), item.id)
    item.aliases.forEach(alias => assert.ok(accepts(item, alias)))
    if (item.language === 'ko' && item.kind === 'word') for (const char of item.glyph) assert.equal((char.charCodeAt(0) - 0xac00) % 28, 0)
  }
})

test('answers normalize edge whitespace and case, while aliases stay item-specific', () => {
  assert.ok(accepts(contentById['hiragana:し'], ' SI '))
  assert.ok(accepts(contentById['hiragana:ち'], 'TI'))
  assert.ok(accepts(contentById['word:コーヒー'], 'KŌHĪ'))
  assert.ok(!accepts(contentById['hiragana:き'], 'k i'))
  assert.ok(!accepts(contentById['hiragana:き'], 'si'))
  assert.ok(!accepts(contentById['hangul:ㄱ'], 'giyeok'))
  assert.ok(accepts(contentById['hangul:ㄱ'], 'ga'))
})

test('independent accuracy includes assisted and skipped attempts in its denominator', () => {
  const s = session()
  for (const [answer, options] of [['a', { ms: 1000 }], ['a', { ms: 3000 }], ['i', {}], ['a', { assisted: true }], ['', { skipped: true }]]) {
    s.attempts.push(attempt(s, 'hiragana:あ', answer, options))
  }
  const result = summarize(s)
  assert.equal(result.accuracy, 40)
  assert.equal(result.correct, 2)
  assert.equal(result.wrong, 1)
  assert.equal(result.assisted, 1)
  assert.equal(result.skipped, 1)
  assert.equal(result.medianMs, 2000)
  assert.equal(summarize(session()).medianMs, null)
})

test('assisted wrong answers remain assisted and are not linguistic successes', () => {
  const s = session()
  const a = attempt(s, 'hiragana:あ', 'wrong', { assisted: true })
  assert.equal(a.outcome, 'assisted')
  assert.equal(a.accepted, false)
  s.attempts.push(a)
  assert.equal(itemProgress('hiragana:あ', [s]).status, 'Belum dilatih')
})

test('progress needs ten independent attempts, two sessions, and no recent errors', () => {
  const first = session({ id: 'first' })
  for (let i = 0; i < 9; i++) first.attempts.push(attempt(first, 'hiragana:あ', 'a'))
  assert.equal(itemProgress('hiragana:あ', [first]).status, 'Sedang dilatih')
  const second = session({ id: 'second' })
  second.attempts.push(attempt(second, 'hiragana:あ', 'a'))
  assert.equal(itemProgress('hiragana:あ', [first, second]).status, 'Lancar sementara')
  second.attempts.push(attempt(second, 'hiragana:あ', '', { skipped: true }))
  assert.equal(itemProgress('hiragana:あ', [first, second]).status, 'Perlu diulang')
})

test('recent item status follows answer time when an older session is resumed', () => {
  const old = session({ id: 'old', startedAt: '2026-11-01T00:00:00Z' })
  const newer = session({ id: 'new', startedAt: '2026-11-02T00:00:00Z' })
  newer.attempts.push({ ...attempt(newer, 'hiragana:あ', 'i'), answeredAt: '2026-11-02T00:00:01Z' })
  for (let index = 0; index < 10; index++) {
    old.attempts.push({ ...attempt(old, 'hiragana:あ', 'a'), answeredAt: `2026-11-03T00:00:${String(index).padStart(2, '0')}Z` })
  }
  assert.equal(itemProgress('hiragana:あ', [old, newer]).status, 'Lancar sementara')
  assert.equal(chronologicalAttempts([newer, old])[0].id, newer.attempts[0].id)
  const data = { ...emptyProgress(), sessions: [old, newer] }
  const restored = validateImport(JSON.stringify(data), new Set(content.map(item => item.id)))
  assert.equal(itemProgress('hiragana:あ', restored.sessions).status, 'Lancar sementara')
  data.sessions[0].attempts[0].answeredAt = 'not-a-date'
  assert.throws(() => validateImport(JSON.stringify(data), new Set(content.map(item => item.id))))
})

test('older backups without answer timestamps remain readable and ordered by session', () => {
  const old = session({ id: 'old', startedAt: '2026-11-01T00:00:00Z' })
  const newer = session({ id: 'new', startedAt: '2026-11-02T00:00:00Z' })
  old.attempts.push(attempt(old, 'hiragana:あ', 'i'))
  newer.attempts.push(attempt(newer, 'hiragana:あ', 'a'))
  for (const s of [old, newer]) for (const a of s.attempts) delete a.answeredAt
  const restored = validateImport(JSON.stringify({ ...emptyProgress(), sessions: [newer, old] }), new Set(content.map(item => item.id)))
  assert.deepEqual(chronologicalAttempts(restored.sessions).map(a => a.sessionId), ['old', 'new'])
})

test('study steps cover all letters in small unlocked groups and suggest relevant words', () => {
  for (const script of ['hiragana', 'katakana', 'hangul']) {
    const steps = studyPath(script, content)
    const ids = steps.flatMap(step => step.items.map(item => item.id))
    assert.equal(ids.length, content.filter(item => item.script === script && item.kind === 'letter').length)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(steps.every(step => step.items.length > 0 && step.items.length <= 5))
  }
  const steps = studyPath('hiragana', content)
  assert.ok(wordsForStep(steps[0].id, steps, content).some(item => item.glyph === 'あお'))
  assert.ok(!wordsForStep(steps[0].id, steps, content).some(item => item.glyph === 'きゃく'))
  assert.deepEqual(wordsForStep('unknown', steps, content), [])
})

test('visual confusion is inferred only from unique, curated, independent letter matches', () => {
  const s = session()
  assert.ok(detectConfusion(attempt(s, 'hiragana:ぬ', 'me'), content, confusionGroups))
  assert.equal(detectConfusion(attempt(s, 'hiragana:ぬ', 'ji'), content, confusionGroups), null)
  assert.equal(detectConfusion(attempt(s, 'hiragana:ぬ', 'me', { assisted: true }), content, confusionGroups), null)
  assert.equal(detectConfusion(attempt(s, 'word:ねこ', 'me'), content, confusionGroups), null)
  assert.equal(detectConfusion(attempt(s, 'hiragana:あ', 'i'), content, confusionGroups), null)
})

test('queues prevent empty sessions, preserve benchmark composition, and interleave reviews', () => {
  assert.deepEqual(makeQueue([], 10), [])
  const pool = selectPool(config(), content)
  assert.equal(pool.length, 5)
  assert.deepEqual(makeQueue(pool, 20, [], true).sort(), makeQueue(pool, 20, [], true).sort())
  const review = makeQueue(pool, 20, ['hiragana:あ', 'hiragana:い'])
  assert.equal(review.filter(id => ['hiragana:あ', 'hiragana:い'].includes(id)).length, 14)
  assert.ok(review.every((id, index) => index === 0 || id !== review[index - 1]))
  const smallReview = makeQueue(pool.slice(0, 2), 20, [pool[0].id])
  assert.ok(smallReview.every((id, index) => index === 0 || id !== smallReview[index - 1]), 'small review pools adjust their ratio to avoid immediate repetition')
  const words = selectPool(config({ kind: 'word', group: 'K' }), content)
  assert.ok(!words.some(item => item.glyph === 'きゃく'), 'a small-kana combination must be introduced separately')
})

test('records exclude pauses, unfinished runs, low accuracy, and incompatible input classes', () => {
  const s = session({ config: config({ mode: 'attack' }), status: 'completed' })
  for (let i = 0; i < 10; i++) s.attempts.push(attempt(s, 'hiragana:あ', 'a'))
  assert.ok(summarize(s).recordEligible)
  assert.ok(!summarize({ ...s, hasPaused: true }).recordEligible)
  assert.ok(!summarize({ ...s, attempts: s.attempts.slice(0, 5) }).recordEligible)
  assert.ok(!summarize({ ...s, config: config({ mode: 'sprint', count: 0 }) }).recordEligible)
  assert.notEqual(comparisonKey(s), comparisonKey({ ...s, device: 'touch' }))
  assert.notEqual(comparisonKey(s), comparisonKey({ ...s, contentVersion: 'future' }))
  assert.ok(!isNewRecord(s, [{ ...s, id: 'faster', activeMs: 9000 }]))
})

test('imports round-trip, interrupt active sessions, and reject invalid data without merging', () => {
  const data = emptyProgress()
  const s = session()
  s.attempts.push(attempt(s, 'hiragana:あ', 'a'))
  data.sessions.push(s)
  const ids = new Set(content.map(item => item.id))
  const result = validateImport(JSON.stringify(data), ids)
  assert.equal(result.sessions.length, 1)
  assert.equal(result.sessions[0].attempts.length, 1)
  assert.equal(result.sessions[0].status, 'interrupted')
  assert.ok(result.sessions[0].hasPaused)
  const invalid = [null, {}, { ...data, schemaVersion: 2 }, { ...data, sessions: [s, s] }, { ...data, sessions: [{ ...s, activeMs: -2 }] }, { ...data, sessions: [{ ...s, queue: ['unknown'] }] }]
  invalid.forEach(value => assert.throws(() => validateImport(JSON.stringify(value), ids)))
  assert.throws(() => validateImport('<script>alert(1)</script>', ids))
  assert.equal(data.sessions[0].status, 'active', 'validation never mutates the source object')
})
