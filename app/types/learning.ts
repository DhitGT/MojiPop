export type Language = 'ja' | 'ko'
export type Script = 'hiragana' | 'katakana' | 'hangul'
export type Kind = 'letter' | 'word'
export type Mode = 'relaxed' | 'attack' | 'sprint'
export type Outcome = 'correct' | 'wrong' | 'assisted' | 'skipped'

export interface ContentItem {
  id: string
  language: Language
  script: Script
  kind: Kind
  glyph: string
  prompt: string
  group: string
  answer: string
  aliases: string[]
  letterName?: string
  meaning?: string
  note: string
  prerequisites: string[]
  source: string
  version: string
}

export interface ConfusionGroup {
  ids: string[]
  note: string
}

export interface PracticeConfig {
  language: Language
  script: Script
  kind: Kind
  group: string
  mode: Mode
  count: number
  source: 'random' | 'benchmark' | 'retry' | 'pair'
  itemIds: string[]
  reviewIds: string[]
}

export interface Attempt {
  id: string
  sessionId: string
  itemId: string
  input: string
  outcome: Outcome
  responseMs: number
  assisted: boolean
  accepted: boolean
  order: number
  /** Optional for backups created before attempt timestamps were introduced. */
  answeredAt?: string
}

export interface Session {
  id: string
  config: PracticeConfig
  contentVersion: string
  device: 'touch' | 'keyboard'
  startedAt: string
  endedAt?: string
  activeMs: number
  status: 'active' | 'paused' | 'interrupted' | 'completed'
  hasPaused: boolean
  attempts: Attempt[]
  queue: string[]
  cursor: number
  unfinished: number
}

export interface Preferences {
  language: Language
  reducedMotion: boolean
  lastConfig: PracticeConfig | null
}

export interface ProgressData {
  schemaVersion: 1
  sessions: Session[]
  settings: Preferences
}
