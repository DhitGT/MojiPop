import type { Script } from './learning'

export interface CampaignInterview {
  experience: 'new' | 'some' | 'confident'
  goal: 'foundation' | 'reading' | 'review'
  minutes: 5 | 10 | 15
}

export interface CampaignAnswer { itemId: string; input: string; correct: boolean }
export interface CampaignTrack {
  interview: CampaignInterview
  assessment: CampaignAnswer[]
  placed: boolean
  startIndex: number
  completed: Record<string, number>
  lesson?: { chapterId: string; phase: 'study' | 'quiz' | 'summary'; answers: CampaignAnswer[] }
}
export interface CampaignData { activeScript?: Script; tracks: Partial<Record<Script, CampaignTrack>> }
