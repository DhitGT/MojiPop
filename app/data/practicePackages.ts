import type { Language, PracticeConfig, Script } from '../types/learning'
import { content } from './content.ts'

export interface PracticePackage {
  id: string
  title: string
  description: string
  symbol: string
  badge: string
  category: 'starter' | 'letters' | 'words' | 'challenge'
  config: PracticeConfig
}

export function practicePackages(language: Language): PracticePackage[] {
  const script: Script = language === 'ja' ? 'hiragana' : 'hangul'
  const basicGroups = language === 'ja' ? ['Vokal', 'K', 'S'] : ['Vokal dasar']
  const starter = content.filter(item => item.script === script && item.kind === 'letter' && item.group === (language === 'ja' ? 'Vokal' : 'Vokal dasar')).slice(0, 5)
  const basic = content.filter(item => item.script === script && item.kind === 'letter' && basicGroups.includes(item.group))
  const words = content.filter(item => item.script === script && item.kind === 'word' && [...item.glyph].length <= 3).slice(0, 12)
  const config = (overrides: Partial<PracticeConfig>): PracticeConfig => ({ language, script, kind: 'letter', group: 'Semua', mode: 'sprint', count: 0, source: 'random', itemIds: [], reviewIds: [], answerFormat: 'choice', ...overrides })
  const label = language === 'ja' ? 'Hiragana' : 'Hangul'
  const packages: PracticePackage[] = [
    { id: 'first-five', category: 'starter', title: `${label} Pertama`, description: 'Kenali 5 huruf vokal.', symbol: starter[0]!.prompt, badge: 'Mulai di sini', config: config({ itemIds: starter.map(item => item.id) }) },
    { id: 'basic', category: 'starter', title: `${label} Dasar`, description: language === 'ja' ? 'Gabungkan vokal, K, dan S.' : 'Latih semua vokal dasar.', symbol: basic.at(-1)!.prompt, badge: `${basic.length} huruf`, config: config({ itemIds: basic.map(item => item.id) }) },
    { id: 'words', category: 'starter', title: 'Tebak Kata', description: 'Pilih bacaan kata pendek.', symbol: words[0]!.prompt, badge: `${words.length} kata`, config: config({ kind: 'word', itemIds: words.map(item => item.id) }) },
    { id: 'mixed', category: 'challenge', title: 'Sprint Campuran', description: 'Tantang ingatan hurufmu.', symbol: '⚡', badge: 'Semua huruf', config: config({}) },
    { id: 'typing', category: 'starter', title: 'Berani Ketik', description: 'Tulis bacaan 5 huruf vokal.', symbol: 'Aa', badge: '5 huruf', config: config({ answerFormat: 'typing', mode: 'relaxed', count: 10, itemIds: starter.map(item => item.id) }) }
  ]
  if (language === 'ja') packages.splice(3, 0, {
    id: 'katakana', category: 'letters', title: 'Katakana Dasar', description: 'Mulai dari vokal, K, dan S.', symbol: 'ア', badge: '15 huruf',
    config: config({ script: 'katakana', itemIds: content.filter(item => item.script === 'katakana' && item.kind === 'letter' && basicGroups.includes(item.group)).map(item => item.id) })
  })
  const add = (id: string, category: PracticePackage['category'], title: string, description: string, pool: typeof content, overrides: Partial<PracticeConfig> = {}) => {
    if (!pool.length) return
    const kind = pool[0]!.kind
    packages.push({ id, category, title, description, symbol: pool[0]!.prompt, badge: `${pool.length} ${kind === 'word' ? 'kata' : 'huruf'}`, config: config({ script: pool[0]!.script, kind, itemIds: pool.map(item => item.id), ...overrides }) })
  }
  if (language === 'ja') {
    for (const kana of ['hiragana', 'katakana'] as const) {
      const name = kana === 'hiragana' ? 'Hiragana' : 'Katakana'
      const letters = content.filter(item => item.script === kana && item.kind === 'letter')
      add(`${kana}-kst`, 'letters', `${name}: K · S · T`, 'Bedakan bunyi ka, sa, dan ta.', letters.filter(item => ['K', 'S', 'T'].includes(item.group)))
      add(`${kana}-nhm`, 'letters', `${name}: N · H · M`, 'Lanjut ke na, ha, dan ma.', letters.filter(item => ['N', 'H', 'M'].includes(item.group)))
      add(`${kana}-yrw`, 'letters', `${name}: Y · R · W`, 'Lengkapi huruf dasar dan n.', letters.filter(item => ['Y', 'R', 'W & N'].includes(item.group)))
      add(`${kana}-dakuten`, 'letters', `${name}: Dakuten`, 'Latih bunyi ga, za, da, dan ba.', letters.filter(item => item.group.startsWith('Dakuten')))
      add(`${kana}-handakuten`, 'letters', `${name}: Bunyi P`, 'Kenali pa, pi, pu, pe, dan po.', letters.filter(item => item.group === 'Handakuten P'))
      add(`${kana}-combo`, 'letters', `${name}: Kombinasi`, 'Baca gabungan seperti kya dan shu.', letters.filter(item => item.group.includes('Kombinasi')))
      const kanaWords = content.filter(item => item.script === kana && item.kind === 'word')
      add(`${kana}-short`, 'words', `Kata Pendek ${name}`, 'Pemanasan kata dua karakter.', kanaWords.filter(item => [...item.glyph].length <= 2))
      add(`${kana}-long`, 'words', `Kata Panjang ${name}`, 'Baca utuh, jangan terburu-buru.', kanaWords.filter(item => [...item.glyph].length >= 3))
      add(`${kana}-small-tsu`, 'words', `Jeda Kecil ${name}`, 'Kenali konsonan ganda dari tsu kecil.', kanaWords.filter(item => /[っッ]/.test(item.glyph)))
      add(`${kana}-type`, 'words', `Ketik Kata ${name}`, 'Uji bacaan tanpa pilihan jawaban.', kanaWords, { answerFormat: 'typing', mode: 'relaxed', count: 10 })
    }
    add('long-vowels', 'words', 'Vokal Panjang', 'Perhatikan ou, uu, dan tanda panjang.', content.filter(item => item.script === 'katakana' && item.kind === 'word' && item.glyph.includes('ー')))
  } else {
    const letters = content.filter(item => item.script === 'hangul' && item.kind === 'letter')
    const consonants = letters.filter(item => item.group === 'Konsonan dasar')
    add('ko-vowels', 'letters', 'Semua Vokal Hangul', 'Bedakan a, eo, o, u, dan eu.', letters.filter(item => item.group === 'Vokal dasar'))
    add('ko-consonants-first', 'letters', 'Konsonan Pertama', 'Kenali 7 konsonan melalui blok bunyi.', consonants.slice(0, 7))
    add('ko-consonants-next', 'letters', 'Konsonan Lanjutan', 'Lengkapi 7 konsonan berikutnya.', consonants.slice(7))
    add('ko-consonants-all', 'letters', 'Semua Konsonan', 'Gabungkan 14 konsonan dasar.', consonants)
    const allWords = content.filter(item => item.script === 'hangul' && item.kind === 'word')
    add('ko-words-first', 'words', 'Kata Hangul Pertama', 'Mulai dari 8 kata dua suku kata.', allWords.slice(0, 8))
    add('ko-words-next', 'words', 'Jelajah Kata Hangul', 'Kenali bacaan kata berikutnya.', allWords.slice(8, 16))
    add('ko-words-all', 'words', 'Campuran Kata Hangul', 'Gabungkan seluruh kosakata latihan.', allWords)
    add('ko-type-words', 'words', 'Ketik Kata Hangul', 'Baca dan tulis romanisasinya sendiri.', allWords, { answerFormat: 'typing', mode: 'relaxed', count: 10 })
  }
  const allLetters = content.filter(item => item.script === script && item.kind === 'letter')
  const allWords = content.filter(item => item.script === script && item.kind === 'word')
  add('attack-letters', 'challenge', 'Kejar 20 Huruf', 'Selesaikan 20 soal secepat mungkin.', allLetters, { mode: 'attack', count: 20 })
  add('sprint-words', 'challenge', 'Sprint Kata', 'Berapa kata bisa kamu baca semenit?', allWords)
  add('attack-words', 'challenge', 'Kejar 20 Kata', 'Jaga akurasi sambil mengejar waktu.', allWords, { mode: 'attack', count: 20 })
  add('sprint-type', 'challenge', 'Sprint Ketik', 'Tanpa pilihan. Ketik sebanyak mungkin.', allLetters, { answerFormat: 'typing' })
  return packages
}
