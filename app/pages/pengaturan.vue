<script setup lang="ts">
import type { ProgressData } from '~/types/learning'
import { content, CONTENT_VERSION } from '~/data/content'
const store = useLearningStore()
useHead({ title: 'Pengaturan · KanaLearn' })
const pendingImport = ref<ProgressData | null>(null)
const action = ref<'reset' | 'import' | null>(null)
const message = ref('')
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
async function chooseFile(event: Event) {
  error.value = ''; message.value = ''
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    if (file.size > 10_000_000) throw new Error('Batas ukuran file adalah 10 MB.')
    pendingImport.value = store.parseImport(await file.text())
    action.value = 'import'
  } catch (caught) { error.value = caught instanceof Error ? caught.message : 'File tidak bisa dibaca.' }
  if (fileInput.value) fileInput.value.value = ''
}
function cancel() { action.value = null; pendingImport.value = null }
async function confirm() {
  error.value = ''; message.value = ''
  try {
    if (action.value === 'reset') { await store.reset(); message.value = 'Progres di browser ini sudah direset.' }
    else if (action.value === 'import' && pendingImport.value) { await store.replaceData(pendingImport.value); message.value = 'Progres berhasil dipulihkan. Sesi yang belum selesai bisa dilanjutkan dari beranda.' }
    cancel()
  } catch (caught) { error.value = `Perubahan gagal disimpan. ${caught instanceof Error ? caught.message : ''}`; cancel() }
}
</script>

<template>
  <div class="settings-simple">
    <div class="page-heading"><h1>Pengaturan</h1></div>
    <div v-if="message" role="status" class="notice success">{{ message }}</div><div v-if="error" role="alert" class="notice danger">{{ error }}</div>
    <section class="panel"><div class="setting-row"><h3>Bahasa</h3><LanguageSwitch /></div><label class="setting-row"><div><h3>Kurangi animasi</h3></div><input type="checkbox" :checked="store.data.value.settings.reducedMotion" @change="store.updateSettings({ reducedMotion: ($event.target as HTMLInputElement).checked })"></label></section>
    <section class="panel"><h2>Cadangan progres</h2><p class="field-help">Progres hanya ada di browser ini. Simpan cadangan sebelum menghapus data browser.</p><button class="button secondary" @click="store.exportProgress"><AppIcon name="download" :size="16" /> Unduh cadangan</button><div class="detail-section"><h3>Pulihkan cadangan</h3><p class="field-help">Mengganti seluruh progres saat ini.</p><label for="import-file" class="field-label">File JSON · maksimal 10 MB</label><input id="import-file" ref="fileInput" class="file-input" type="file" accept="application/json,.json" :disabled="store.busy.value" @change="chooseFile"></div></section>
    <details class="disclosure"><summary>Reset progres</summary><p>Hapus seluruh riwayat dan preferensi di browser ini.</p><button class="button secondary" :disabled="store.busy.value" @click="action = 'reset'">Reset progres</button></details>
    <details class="disclosure"><summary>Tentang & sumber materi</summary><p>Konten masih draf dan belum ditinjau penelaah bahasa. Latihan menilai bacaan ketik, bukan pelafalan.</p><p>{{ content.filter(item => item.kind === 'word' && item.language === 'ja').length }} kata Jepang · {{ content.filter(item => item.kind === 'word' && item.language === 'ko').length }} kata Korea · {{ CONTENT_VERSION }}</p><div class="button-row"><a href="https://www.irodori.jpf.go.jp/en/starter/pdf.html" target="_blank" rel="noopener noreferrer" class="text-link">Irodori ↗</a><a href="https://www.korean.go.kr/front_eng/roman/roman_01.do" target="_blank" rel="noopener noreferrer" class="text-link">Romanisasi Korea ↗</a></div></details>
    <ConfirmDialog :open="action !== null" :title="action === 'reset' ? 'Hapus seluruh progres?' : 'Ganti progres saat ini?'" :confirm-label="action === 'reset' ? 'Ya, reset progres' : 'Ya, ganti progres'" :busy="store.busy.value" @cancel="cancel" @confirm="confirm"><p>{{ action === 'reset' ? 'Seluruh riwayat dan pengaturan akan dihapus. Unduh cadangan terlebih dahulu jika ingin menyimpannya.' : `Cadangan berisi ${pendingImport?.sessions.length || 0} sesi. Progres saat ini akan diganti.` }}</p></ConfirmDialog>
  </div>
</template>
