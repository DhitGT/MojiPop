<script setup lang="ts">
const colorMode = useColorMode()
const dark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <ClientOnly>
    <button class="theme-toggle" type="button" aria-label="Mode gelap" :aria-pressed="dark" :title="dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'" @click="colorMode.preference = dark ? 'light' : 'dark'">
      <AppIcon :name="dark ? 'sun' : 'moon'" :size="18" />
      <span>{{ dark ? 'Mode terang' : 'Mode gelap' }}</span>
    </button>
    <template #fallback><button class="theme-toggle" type="button" aria-label="Mode gelap" disabled><AppIcon name="moon" :size="18" /><span>Mode gelap</span></button></template>
  </ClientOnly>
</template>
