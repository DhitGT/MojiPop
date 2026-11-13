<script setup lang="ts">
import type { Language } from '~/types/learning'
const store = useLearningStore()
function choose(language: Language) { store.updateSettings({ language }) }
</script>

<template>
  <div class="language-switch" role="group" aria-label="Bahasa yang dipelajari">
    <button :class="{ selected: store.data.value.settings.language === 'ja' }" :aria-pressed="store.data.value.settings.language === 'ja'" @click="choose('ja')"><span>🇯🇵</span> Jepang</button>
    <button :class="{ selected: store.data.value.settings.language === 'ko' }" :aria-pressed="store.data.value.settings.language === 'ko'" @click="choose('ko')"><span>🇰🇷</span> Korea</button>
  </div>
</template>
