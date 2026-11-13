import type { ContentItem, Script } from '../types/learning'

export interface StudyStep {
  id: string
  group: string
  title: string
  items: ContentItem[]
}

export function studyPath(script: Script, content: ContentItem[]): StudyStep[] {
  const letters = content.filter(item => item.script === script && item.kind === 'letter')
  const groups = [...new Set(letters.map(item => item.group))]
  // Vowels introduce the blocks used by the subsequent Hangul consonant exercises.
  if (script === 'hangul') groups.sort((a, b) => Number(b === 'Vokal dasar') - Number(a === 'Vokal dasar'))
  return groups.flatMap(group => {
    const items = letters.filter(item => item.group === group)
    const steps: StudyStep[] = []
    for (let index = 0; index < items.length; index += 5) {
      steps.push({
        id: `${script}:${group}:${index / 5 + 1}`,
        group, title: items.length > 5 ? `${group} ${index / 5 + 1}` : group,
        items: items.slice(index, index + 5)
      })
    }
    return steps
  })
}

export function wordsForStep(stepId: string, steps: StudyStep[], content: ContentItem[]): ContentItem[] {
  const index = steps.findIndex(step => step.id === stepId)
  if (index < 0) return []
  const known = new Set(steps.slice(0, index + 1).flatMap(step => step.items.map(item => item.id)))
  const current = new Set(steps[index]!.items.map(item => item.id))
  const script = steps[index]!.items[0]?.script
  return content.filter(item => item.script === script && item.kind === 'word'
    && item.prerequisites.length > 0 && item.prerequisites.every(id => known.has(id))
    && item.prerequisites.some(id => current.has(id)))
}
