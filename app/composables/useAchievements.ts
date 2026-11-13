import { content } from '~/data/content'
import { achievementProgress } from '~/utils/achievements'

export function useAchievements() {
  const store = useLearningStore()
  const today = useState('achievement-clock', () => Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => { today.value = Date.now(); timer = setInterval(() => { today.value = Date.now() }, 60000) })
  onUnmounted(() => clearInterval(timer))
  return computed(() => achievementProgress(store.data.value.sessions, content, new Date(today.value)))
}
