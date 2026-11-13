import type { ContentItem, ConfusionGroup, Script } from '../types/learning'

export const CONTENT_VERSION = '2026.11-draft.1'
export const sources = {
  ja: 'https://www.irodori.jpf.go.jp/en/starter/pdf.html',
  ko: 'https://www.korean.go.kr/front_eng/roman/roman_01.do'
}

const rows = [
  ['Vokal', 'あいうえお', 'a i u e o'],
  ['K', 'かきくけこ', 'ka ki ku ke ko'],
  ['S', 'さしすせそ', 'sa shi su se so'],
  ['T', 'たちつてと', 'ta chi tsu te to'],
  ['N', 'なにぬねの', 'na ni nu ne no'],
  ['H', 'はひふへほ', 'ha hi fu he ho'],
  ['M', 'まみむめも', 'ma mi mu me mo'],
  ['Y', 'やゆよ', 'ya yu yo'],
  ['R', 'らりるれろ', 'ra ri ru re ro'],
  ['W & N', 'わをん', 'wa wo n'],
  ['Dakuten G', 'がぎぐげご', 'ga gi gu ge go'],
  ['Dakuten Z', 'ざじずぜぞ', 'za ji zu ze zo'],
  ['Dakuten D', 'だぢづでど', 'da ji zu de do'],
  ['Dakuten B', 'ばびぶべぼ', 'ba bi bu be bo'],
  ['Handakuten P', 'ぱぴぷぺぽ', 'pa pi pu pe po']
] as const

const aliases: Record<string, string[]> = {
  shi: ['si'], chi: ['ti'], tsu: ['tu'], fu: ['hu'], ji: ['zi'],
  sha: ['sya'], shu: ['syu'], sho: ['syo'],
  cha: ['tya', 'cya'], chu: ['tyu', 'cyu'], cho: ['tyo', 'cyo'],
  ja: ['jya', 'zya'], ju: ['jyu', 'zyu'], jo: ['jyo', 'zyo']
}

export const toKatakana = (text: string) => [...text].map(char => {
  const code = char.codePointAt(0)!
  return code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : char
}).join('')

const items: ContentItem[] = []
function kana(glyph: string, answer: string, group: string, script: Script, note = '') {
  items.push({
    id: `${script}:${glyph}`, language: 'ja', script, kind: 'letter', glyph, prompt: glyph,
    group, answer, aliases: glyph === 'ぢ' || glyph === 'ヂ' ? ['di'] : glyph === 'づ' || glyph === 'ヅ' ? ['du'] : aliases[answer] || [],
    note: note || 'Baca sebagai satu bunyi. Ketik romanisasinya dengan huruf Latin.',
    prerequisites: [], source: sources.ja, version: CONTENT_VERSION
  })
}

for (const script of ['hiragana', 'katakana'] as const) {
  for (const [group, glyphs, readings] of rows) {
    ;[...glyphs].forEach((glyph, index) => {
      const actual = script === 'katakana' ? toKatakana(glyph) : glyph
      const note = glyph === 'ん' ? 'Bunyi nasal n. Dalam kata, perhatikan batas suku kata sebelum vokal atau y.'
        : glyph === 'を' ? 'Di kartu ini gunakan wo. Sebagai partikel biasanya dibaca o; partikel tidak diuji tanpa konteks.'
        : 'じぢずづ'.includes(glyph) ? 'Sebagian kana berbagi romanisasi. Jawaban ketik saja tidak membedakan じ/ぢ atau ず/づ.' : ''
      kana(actual, readings.split(' ')[index]!, group, script, note)
    })
  }
  const bases = [['き', 'ky'], ['し', 'sh'], ['ち', 'ch'], ['に', 'ny'], ['ひ', 'hy'], ['み', 'my'], ['り', 'ry'], ['ぎ', 'gy'], ['じ', 'j'], ['び', 'by'], ['ぴ', 'py']] as const
  for (const [base, prefix] of bases) {
    ;[['ゃ', 'a'], ['ゅ', 'u'], ['ょ', 'o']].forEach(([small, vowel]) => {
      const glyph = `${base}${small}`
      kana(script === 'katakana' ? toKatakana(glyph) : glyph, `${prefix}${vowel}`, 'Kombinasi kecil', script,
        'Huruf kedua berukuran kecil: baca gabungannya sebagai satu suku kata, bukan dua bunyi terpisah.')
    })
  }
}

// Explicit answers are attached to each word, never produced by global substitution.
const japaneseWords: [string, string, string, string[]?][] = [
  ['あお', 'ao', 'biru'], ['あか', 'aka', 'merah'], ['いえ', 'ie', 'rumah'], ['うえ', 'ue', 'atas'],
  ['えき', 'eki', 'stasiun'], ['かお', 'kao', 'wajah'], ['かき', 'kaki', 'kesemek'], ['かさ', 'kasa', 'payung'],
  ['くち', 'kuchi', 'mulut', ['kuti']], ['くつ', 'kutsu', 'sepatu', ['kutu']], ['ここ', 'koko', 'di sini'],
  ['さけ', 'sake', 'salmon'], ['しお', 'shio', 'garam', ['sio']], ['すし', 'sushi', 'sushi', ['susi']],
  ['そと', 'soto', 'luar'], ['たこ', 'tako', 'gurita'], ['ちか', 'chika', 'bawah tanah', ['tika']],
  ['つき', 'tsuki', 'bulan', ['tuki']], ['てら', 'tera', 'kuil'], ['とり', 'tori', 'burung'],
  ['なつ', 'natsu', 'musim panas', ['natu']], ['にく', 'niku', 'daging'], ['ぬの', 'nuno', 'kain'],
  ['ねこ', 'neko', 'kucing'], ['のり', 'nori', 'rumput laut'], ['はな', 'hana', 'bunga'],
  ['ひと', 'hito', 'orang'], ['ふね', 'fune', 'kapal', ['hune']], ['へや', 'heya', 'kamar'],
  ['ほし', 'hoshi', 'bintang', ['hosi']], ['まち', 'machi', 'kota', ['mati']], ['みみ', 'mimi', 'telinga'],
  ['むし', 'mushi', 'serangga', ['musi']], ['めし', 'meshi', 'nasi / makanan', ['mesi']], ['もも', 'momo', 'persik'],
  ['やま', 'yama', 'gunung'], ['ゆき', 'yuki', 'salju'], ['よる', 'yoru', 'malam'],
  ['りす', 'risu', 'tupai'], ['いぬ', 'inu', 'anjing'], ['うみ', 'umi', 'laut'], ['かわ', 'kawa', 'sungai'],
  ['そら', 'sora', 'langit'], ['あめ', 'ame', 'hujan'], ['おと', 'oto', 'suara'], ['おかし', 'okashi', 'camilan', ['okasi']],
  ['さかな', 'sakana', 'ikan'], ['たまご', 'tamago', 'telur'], ['ごま', 'goma', 'wijen'], ['ぶた', 'buta', 'babi'],
  ['かぜ', 'kaze', 'angin'], ['かぎ', 'kagi', 'kunci'], ['みず', 'mizu', 'air'], ['まど', 'mado', 'jendela'],
  ['えび', 'ebi', 'udang'], ['ぱん', 'pan', 'roti'], ['でんわ', 'denwa', 'telepon'], ['ほん', 'hon', 'buku'],
  ['にほん', 'nihon', 'Jepang'], ['じかん', 'jikan', 'waktu', ['zikan']],
  ['きゃく', 'kyaku', 'tamu'], ['おちゃ', 'ocha', 'teh', ['otya', 'ocya']],
  ['きって', 'kitte', 'perangko'], ['がっこう', 'gakkou', 'sekolah', ['gakkō']],
  ['しんよう', 'shinyou', 'kepercayaan', ["shin'you", "sin'you"]],
  ['コーヒー', 'koohii', 'kopi', ['kōhī']], ['ケーキ', 'keeki', 'kue', ['kēki']],
  ['カメラ', 'kamera', 'kamera'], ['テレビ', 'terebi', 'televisi'], ['バス', 'basu', 'bus'],
  ['パン', 'pan', 'roti'], ['ペン', 'pen', 'pena'], ['ホテル', 'hoteru', 'hotel'],
  ['ラジオ', 'rajio', 'radio', ['razio']], ['ミルク', 'miruku', 'susu'], ['トマト', 'tomato', 'tomat'],
  ['タクシー', 'takushii', 'taksi', ['takusii', 'takushī']], ['シャツ', 'shatsu', 'kemeja', ['syatu']],
  ['ベッド', 'beddo', 'tempat tidur'], ['チョコ', 'choko', 'cokelat', ['tyoko', 'cyoko']]
]

for (const [glyph, answer, meaning, validAliases = []] of japaneseWords) {
  const script = /[ァ-ー]/.test(glyph) ? 'katakana' : 'hiragana'
  const constituents: string[] = []
  for (let index = 0; index < glyph.length; index++) {
    const pair = glyph.slice(index, index + 2)
    if (items.some(item => item.id === `${script}:${pair}`)) { constituents.push(pair); index++ }
    else if (!'っッーゃゅょャュョ'.includes(glyph[index]!)) constituents.push(glyph[index]!)
  }
  items.push({ id: `word:${glyph}`, language: 'ja', script, kind: 'word', glyph, prompt: glyph,
    group: /[っッー]|[ゃゅょャュョ]|[んン]/.test(glyph) || answer.includes('ou') ? 'Pola lanjutan' : 'Kata dasar',
    answer, aliases: validAliases, meaning,
    note: /[っッ]/.test(glyph) ? 'っ / ッ kecil menggandakan konsonan berikutnya: perhatikan jeda pendek.'
      : glyph.includes('ー') ? 'Tanda ー memanjangkan vokal sebelumnya. Jawaban panjang dan alias ditetapkan per kata.'
      : glyph === 'しんよう' ? "ん diikuti よ: shin'you memperjelas batas n + yo. Bukan gabungan にょ."
      : glyph.includes('こう') ? 'おう di kata ini merupakan vokal panjang. Bentuk ou dan ō diterima untuk kata ini.'
      : 'Baca seluruh kata sebelum menekan Enter. Kesalahan dicatat untuk kata utuh.',
    prerequisites: [...new Set(constituents.map(char => `${script}:${char}`))], source: sources.ja, version: CONTENT_VERSION
  })
}

const consonants = [
  ['ㄱ', '가', 'ga', 'giyeok'], ['ㄴ', '나', 'na', 'nieun'], ['ㄷ', '다', 'da', 'digeut'],
  ['ㄹ', '라', 'ra', 'rieul'], ['ㅁ', '마', 'ma', 'mieum'], ['ㅂ', '바', 'ba', 'bieup'],
  ['ㅅ', '사', 'sa', 'siot'], ['ㅇ', '아', 'a', 'ieung'], ['ㅈ', '자', 'ja', 'jieut'],
  ['ㅊ', '차', 'cha', 'chieut'], ['ㅋ', '카', 'ka', 'kieuk'], ['ㅌ', '타', 'ta', 'tieut'],
  ['ㅍ', '파', 'pa', 'pieup'], ['ㅎ', '하', 'ha', 'hieut']
] as const
for (const [glyph, prompt, answer, name] of consonants) {
  items.push({ id: `hangul:${glyph}`, language: 'ko', script: 'hangul', kind: 'letter', glyph, prompt,
    group: 'Konsonan dasar', answer, aliases: [], letterName: name,
    note: `Nama huruf: ${name}. Latihan meminta bunyi blok ${prompt}, bukan nama huruf ${glyph}. ${glyph === 'ㅇ' ? 'ㅇ di awal blok tidak berbunyi; di akhir blok berbunyi ng.' : 'Bunyi konsonan dapat berubah menurut posisi. Di sini konsonan berada sebelum vokal ㅏ.'}`,
    prerequisites: [], source: sources.ko, version: CONTENT_VERSION })
}
for (const [index, glyph] of [...'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'].entries()) {
  const answer = ['a', 'ya', 'eo', 'yeo', 'o', 'yo', 'u', 'yu', 'eu', 'i'][index]!
  items.push({ id: `hangul:${glyph}`, language: 'ko', script: 'hangul', kind: 'letter', glyph,
    prompt: [...'아야어여오요우유으이'][index]!, group: 'Vokal dasar', answer, aliases: [],
    note: 'Vokal ditulis dalam blok dengan ㅇ sebagai pengisi awal tanpa bunyi. eo dan eu adalah romanisasi satu vokal, bukan dua suku kata.',
    prerequisites: [], source: sources.ko, version: CONTENT_VERSION })
}

const koreanWords = [
  ['나무', 'namu', 'pohon'], ['바다', 'bada', 'laut'], ['나비', 'nabi', 'kupu-kupu'],
  ['아기', 'agi', 'bayi'], ['오이', 'oi', 'mentimun'], ['우유', 'uyu', 'susu'],
  ['고기', 'gogi', 'daging'], ['가구', 'gagu', 'perabot'], ['구두', 'gudu', 'sepatu formal'],
  ['모자', 'moja', 'topi'], ['바지', 'baji', 'celana'], ['치마', 'chima', 'rok'],
  ['사자', 'saja', 'singa'], ['여우', 'yeou', 'rubah'], ['오리', 'ori', 'bebek'],
  ['소리', 'sori', 'suara'], ['머리', 'meori', 'kepala'], ['다리', 'dari', 'kaki / jembatan'],
  ['도로', 'doro', 'jalan'], ['하루', 'haru', 'satu hari'], ['가수', 'gasu', 'penyanyi'],
  ['요리', 'yori', 'masakan'], ['휴지', 'hyuji', 'tisu'], ['코', 'ko', 'hidung']
] as const
const initialJamo = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ']
const vowelJamo = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ']
for (const [glyph, answer, meaning] of koreanWords) {
  const prerequisites = [...glyph].flatMap(char => {
    const syllable = char.charCodeAt(0) - 0xac00
    return [`hangul:${initialJamo[Math.floor(syllable / 588)]}`, `hangul:${vowelJamo[Math.floor(syllable % 588 / 28)]}`]
  })
  items.push({ id: `word:${glyph}`, language: 'ko', script: 'hangul', kind: 'word', glyph, prompt: glyph,
    group: 'Kata tanpa batchim', answer, aliases: [], meaning,
    note: 'Baca tiap blok dari konsonan awal ke vokal. Kata ini tidak memiliki konsonan akhir (batchim).',
    prerequisites: [...new Set(prerequisites)], source: sources.ko, version: CONTENT_VERSION })
}

export const content: ContentItem[] = items
export const contentById = Object.fromEntries(content.map(item => [item.id, item])) as Record<string, ContentItem>
export const confusionGroups: ConfusionGroup[] = [
  { ids: ['hiragana:ぬ', 'hiragana:め'], note: 'ぬ (nu) memiliki simpul kecil di ujung kanan bawah. め (me) tidak memiliki simpul itu.' },
  { ids: ['hiragana:れ', 'hiragana:ね'], note: 'ね (ne) berakhir dengan simpul di kanan. れ (re) berakhir dengan sapuan terbuka.' },
  { ids: ['katakana:シ', 'katakana:ツ'], note: 'シ (shi): dua goresan pendek lebih mendatar. ツ (tsu): goresannya lebih tegak. Perhatikan posisi awal goresan panjang.' },
  { ids: ['katakana:ソ', 'katakana:ン'], note: 'ソ (so) memiliki goresan pendek lebih tegak; ン (n) lebih mendatar. Bandingkan arah goresan panjangnya.' },
  { ids: ['hangul:ㅏ', 'hangul:ㅓ'], note: 'ㅏ (a): garis pendek ke kanan. ㅓ (eo): garis pendek ke kiri. Keduanya ditampilkan dalam blok saat latihan.' }
]

export const scriptLabels = { hiragana: 'Hiragana', katakana: 'Katakana', hangul: 'Hangul' }
export const modeLabels = { relaxed: 'Santai', attack: 'Time Attack', sprint: 'Sprint 60 detik' }
