<script setup lang="ts">
useSiteSeo()
const route = useRoute()
const sounds = useSoundEffects()
function silenceHiddenPage() { if (document.hidden) sounds.stop() }
onMounted(() => {
  document.addEventListener('pointerdown', sounds.unlock, true)
  document.addEventListener('keydown', sounds.unlock, true)
  document.addEventListener('visibilitychange', silenceHiddenPage)
  window.addEventListener('pagehide', sounds.stop)
})
onBeforeUnmount(() => {
  sounds.stop()
  document.removeEventListener('pointerdown', sounds.unlock, true)
  document.removeEventListener('keydown', sounds.unlock, true)
  document.removeEventListener('visibilitychange', silenceHiddenPage)
  window.removeEventListener('pagehide', sounds.stop)
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <WelcomeIntro v-if="route.path !== '/'" />
  </UApp>
</template>
