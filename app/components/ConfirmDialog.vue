<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean, title: string, confirmLabel: string, busy?: boolean }>(), { busy: false })
const emit = defineEmits<{ confirm: [], cancel: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
watch(() => props.open, async open => { await nextTick(); if (open && !dialog.value?.open) dialog.value?.showModal(); else if (!open) dialog.value?.close() })
onMounted(() => { if (props.open) dialog.value?.showModal() })
</script>

<template>
  <dialog ref="dialog" class="confirm-dialog" aria-labelledby="confirm-title" @cancel.prevent="!busy && emit('cancel')">
    <h2 id="confirm-title">{{ title }}</h2><div class="dialog-copy"><slot /></div><div class="button-row" style="justify-content:end"><button autofocus class="button secondary" :disabled="busy" @click="emit('cancel')">Batal</button><button class="button danger-button" :disabled="busy" @click="emit('confirm')">{{ busy ? 'Menyimpan…' : confirmLabel }}</button></div>
  </dialog>
</template>

<style scoped>
.confirm-dialog { width: min(440px, calc(100vw - 40px)); border: 1px solid #e9e0f2; border-radius: 20px; padding: 28px; margin: auto; color: var(--ink); background: white; box-shadow: 0 20px 100px #29213933; }
.confirm-dialog::backdrop { background: #29213966; backdrop-filter: blur(3px); }
.dialog-copy { font-size: 12px; color: #95829e; margin: 16px 0 24px; line-height: 1.8; }
</style>
