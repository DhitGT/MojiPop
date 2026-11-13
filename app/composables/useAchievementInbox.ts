export function useAchievementInbox() {
  const store = useLearningStore()
  const progress = useAchievements()
  const unread = computed(() => {
    if (!store.ready.value || store.busy.value) return []
    const seen = new Set(store.data.value.settings.achievementSeenIds ?? [])
    return progress.value.achievements.filter(entry => entry.unlocked && !seen.has(entry.id))
  })
  function markRead() {
    if (!unread.value.length) return
    const ids = progress.value.achievements.filter(entry => entry.unlocked).map(entry => entry.id)
    store.updateSettings({ achievementSeenIds: ids })
  }
  return { unread, markRead }
}
