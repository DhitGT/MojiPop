<script setup lang="ts">
withDefaults(defineProps<{ decorative?: boolean }>(), { decorative: false })
</script>

<template>
  <img src="/images/kiko-mascot.png" :alt="decorative ? '' : 'Kiko, maskot kucing KanaLearn'" width="1254" height="1254" class="kiko-mascot" decoding="async" draggable="false">
</template>
