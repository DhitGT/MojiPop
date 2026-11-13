import type { ContentItem } from '../types/learning'

export interface RaceToken { id: string; glyph: string; answer: string; start: number; end: number }
export interface RaceFrame { at: number; position: number }
export interface RaceSample { at: number; wpm: number; raw: number; accuracy: number; errors: number; strokes: number }

export function raceConsistency(samples: RaceSample[]): number | null {
  const rates = samples.slice(1).flatMap((sample, index) => {
    const previous = samples[index]!
    const duration = sample.at - previous.at
    return duration >= 250 ? [(sample.strokes - previous.strokes) / duration * 1000] : []
  })
  if (rates.length < 2) return null
  const mean = rates.reduce((sum, value) => sum + value, 0) / rates.length
  if (!mean) return 0
  const deviation = Math.sqrt(rates.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rates.length)
  return Math.round(Math.max(0, 1 - deviation / mean) * 100)
}

/** Keep whole words; length is the requested number of source-script characters. */
export function makeRace(pool: ContentItem[], length: number, random = Math.random): RaceToken[] {
  if (!pool.length || !Number.isFinite(length) || length < 1) return []
  const tokens: RaceToken[] = []
  let characters = 0
  let offset = 0
  while (characters < Math.min(length, 1000)) {
    const item = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!
    const answer = item.answer.toLowerCase()
    tokens.push({ id: item.id, glyph: item.prompt, answer, start: offset, end: offset + answer.length })
    offset += answer.length + 1
    characters += [...item.prompt].length
  }
  return tokens
}

export function raceMetrics(input: string, target: string, elapsed: number, hits: number, strokes: number) {
  const correct = [...input].filter((char, index) => char === target[index]).length
  const minutes = elapsed / 60000
  return { correct, wpm: minutes > 0 ? Math.round(correct / 5 / minutes) : 0,
    raw: minutes > 0 ? Math.round(strokes / 5 / minutes) : 0,
    accuracy: strokes ? Math.round(hits / strokes * 100) : 100 }
}

/** Count inserted characters, excluding the unchanged suffix when editing in the middle. */
export function insertedRange(before: string, after: string): [number, number] {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) start++
  let suffix = 0
  while (suffix < before.length - start && suffix < after.length - start
    && before[before.length - suffix - 1] === after[after.length - suffix - 1]) suffix++
  return [start, after.length - suffix]
}

export function ghostPosition(frames: RaceFrame[], elapsed: number) {
  let low = 0
  let high = frames.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (frames[mid]!.at <= elapsed) low = mid + 1
    else high = mid
  }
  return low ? frames[low - 1]!.position : 0
}
