<script setup lang="ts">
withDefaults(defineProps<{ decorative?: boolean, celebrate?: boolean }>(), {
  decorative: false,
  celebrate: false
})
</script>

<template>
  <KikoMascot character="mimi" :decorative="decorative" :celebrate="celebrate" />
</template>
