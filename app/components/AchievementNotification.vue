<script setup lang="ts">
const store = useLearningStore()
const route = useRoute()
const sounds = useSoundEffects()
const progress = useAchievements()
const snackbar = ref<HTMLElement | null>(null)
const hovering = ref(false)
const message = ref('')
const badge = ref<{ category: import('~/utils/achievements').AchievementMetric; tier: number; label: string }>()
let known: Set<string> | undefined
let dismissTimer: ReturnType<typeof setTimeout> | undefined
function pause() { clearTimeout(dismissTimer) }
function dismiss() { pause(); hovering.value = false; message.value = '' }
function scheduleDismiss() {
  pause()
  if (hovering.value || snackbar.value?.contains(document.activeElement)) return
  dismissTimer = setTimeout(dismiss, 7000)
}
function leaveFocus(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && snackbar.value?.contains(event.relatedTarget)) return
  scheduleDismiss()
}
onUnmounted(pause)
watch(() => route.path, path => { if (path === '/achievement') dismiss() })
watch(() => [store.ready.value, store.busy.value, progress.value.achievements] as const, ([ready, busy, entries]) => {
  if (!ready) return
  const unlocked = entries.filter(entry => entry.unlocked)
  const ids = new Set(unlocked.map(entry => entry.id))
  if (known && !busy) {
    const added = unlocked.filter(entry => !known!.has(entry.id))
    if (added.length) {
      const entry = added[0]!
      message.value = `${entry.name} terbuka!${added.length > 1 ? ` +${added.length - 1} pencapaian lainnya.` : ''}`
      badge.value = { category: entry.track, tier: entry.tier, label: entry.name }
      scheduleDismiss()
      void sounds.play('achievement')
    }
    if ([...known].some(id => !ids.has(id))) dismiss()
  }
  known = ids
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="achievement-snack">
      <aside v-if="message" ref="snackbar" class="achievement-notification" :class="{ 'arena-snackbar': route.path === '/arena', 'snack-reduce-motion': store.data.value.settings.reducedMotion }" aria-label="Achievement baru" @pointerenter="hovering = true; pause()" @pointerleave="hovering = false; scheduleDismiss()" @focusin="pause" @focusout="leaveFocus">
        <AchievementBadge v-if="badge" v-bind="badge" /><div class="snackbar-copy"><span class="snackbar-eyebrow">Achievement baru!</span><p role="status" aria-atomic="true">{{ message }}</p><NuxtLink to="/achievement" class="text-link" @click="dismiss">Lihat achievement <AppIcon name="arrow" :size="13" /></NuxtLink></div><button type="button" aria-label="Tutup notifikasi achievement" @click="dismiss"><AppIcon name="close" :size="18" /></button>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.achievement-notification { position: fixed; right: max(20px,env(safe-area-inset-right)); bottom: max(24px,env(safe-area-inset-bottom)); z-index: 90; width: 390px; max-width: calc(100vw - 32px); display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid var(--accent); border-radius: 16px; background: var(--surface); color: var(--ink); box-shadow: 0 8px 32px #0002; }
.snackbar-copy { flex: 1; min-width: 0; }.snackbar-eyebrow { display: block; color: var(--accent); font-size: 10px; font-weight: 750; margin-bottom: 4px; }.achievement-notification p { font-size: 13px; font-weight: 650; line-height: 1.5; }.achievement-notification .text-link { margin-top: 6px; }.achievement-notification button { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; color: var(--muted); cursor: pointer; }.achievement-notification button:hover { background: var(--accent-light); }
.achievement-notification .achievement-badge { width: 58px; flex-shrink: 0; }
.achievement-snack-enter-active,.achievement-snack-leave-active { transition: opacity .2s ease,transform .2s ease; }.achievement-snack-enter-from,.achievement-snack-leave-to { opacity: 0; transform: translateY(16px); }.snack-reduce-motion { transition: none; }
@media(prefers-reduced-motion:reduce) { .achievement-snack-enter-active,.achievement-snack-leave-active { transition: none; } }
@media(max-width:680px) { .achievement-notification { bottom: calc(96px + env(safe-area-inset-bottom)); right: 16px; }.achievement-notification.arena-snackbar { bottom: calc(16px + env(safe-area-inset-bottom)); } }
</style>
