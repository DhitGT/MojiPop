<script setup lang="ts">
import type { ProgressData } from '~/types/learning'
import type { SoundEffect } from '~/composables/useSoundEffects'
import { content, CONTENT_VERSION } from '~/data/content'
const store = useLearningStore()
const sounds = useSoundEffects()
const previewSound = ref<SoundEffect>('correct')
const soundOptions: { value: SoundEffect; label: string }[] = [
  { value: 'correct', label: 'Jawaban benar' }, { value: 'wrong', label: 'Jawaban salah' },
  { value: 'hint', label: 'Bantuan' }, { value: 'skip', label: 'Lewati soal' },
  { value: 'complete', label: 'Sesi selesai' }, { value: 'achievement', label: 'Achievement baru' },
  { value: 'type', label: 'Ketikan' }, { value: 'typo', label: 'Salah ketik' }
]
const intro = useIntro()
const colorMode = useColorMode()
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
    <section class="panel"><h2>Tampilan</h2><p class="field-help">Pilih tema yang nyaman untuk belajar. Pilihan disimpan di browser ini.</p><div class="field"><label for="color-theme">Tema aplikasi</label><ClientOnly><select id="color-theme" v-model="colorMode.preference"><option value="system">Ikuti perangkat</option><option value="light">Terang</option><option value="dark">Gelap</option></select><template #fallback><select id="color-theme" disabled><option>Memuat tema…</option></select></template></ClientOnly></div></section>
    <section class="panel"><h2>Kenalan dengan KanaLearn</h2><p class="field-help">Lihat lagi cara belajar, pilihan latihan, dan teman belajarmu, Kiko.</p><button class="button secondary" @click="intro.replay"><AppIcon name="play" :size="16" /> Putar ulang intro</button></section>
    <div v-if="message" role="status" class="notice success">{{ message }}</div><div v-if="error" role="alert" class="notice danger">{{ error }}</div>
    <section class="panel">
      <div class="setting-row"><h3>Bahasa</h3><LanguageSwitch /></div>
      <label class="setting-row"><div><h3>Efek suara</h3><p>Nada jawaban, bantuan, Typing Race, selesai latihan, dan achievement baru.</p></div><input type="checkbox" :checked="sounds.enabled.value" @change="sounds.toggle(($event.target as HTMLInputElement).checked)"></label>
      <div class="sound-controls" :class="{ 'is-muted': !sounds.enabled.value }">
      <div class="volume-heading"><label for="sound-volume">Volume efek suara</label><output for="sound-volume">{{ sounds.volume.value }}%</output></div>
      <input id="sound-volume" type="range" min="0" max="100" step="5" :value="sounds.volume.value" :disabled="!sounds.enabled.value" :aria-valuetext="sounds.volume.value + ' persen'" @input="sounds.setVolume(Number(($event.target as HTMLInputElement).value))" @change="sounds.play(previewSound)">
      <div class="sound-preview"><div class="field"><label for="sound-preview">Coba efek suara</label><select id="sound-preview" v-model="previewSound" :disabled="!sounds.enabled.value"><option v-for="option in soundOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></div><button type="button" class="button secondary" :disabled="!sounds.enabled.value || sounds.volume.value === 0" @click="sounds.play(previewSound)"><AppIcon name="play" :size="16" /> Putar suara</button></div>
      <p class="field-help">{{ !sounds.enabled.value ? 'Efek suara dimatikan.' : sounds.volume.value === 0 ? 'Volume 0%: semua efek suara senyap.' : 'Berlaku untuk latihan, Typing Race, dan achievement. Tersimpan di browser ini.' }}</p>
    </div>
      <label class="setting-row"><div><h3>Kurangi animasi</h3></div><input type="checkbox" :checked="store.data.value.settings.reducedMotion" @change="store.updateSettings({ reducedMotion: ($event.target as HTMLInputElement).checked })"></label></section>
    <section class="panel"><h2>Cadangan progres</h2><p class="field-help">Progres hanya ada di browser ini. Simpan cadangan sebelum menghapus data browser.</p><button class="button secondary" @click="store.exportProgress"><AppIcon name="download" :size="16" /> Unduh cadangan</button><div class="detail-section"><h3>Pulihkan cadangan</h3><p class="field-help">Mengganti seluruh progres saat ini.</p><label for="import-file" class="field-label">File JSON · maksimal 10 MB</label><input id="import-file" ref="fileInput" class="file-input" type="file" accept="application/json,.json" :disabled="store.busy.value" @change="chooseFile"></div></section>
    <details class="disclosure"><summary>Reset progres</summary><p>Hapus seluruh riwayat dan preferensi di browser ini.</p><button class="button secondary" :disabled="store.busy.value" @click="action = 'reset'">Reset progres</button></details>
    <details class="disclosure"><summary>Tentang & sumber materi</summary><p>Konten masih draf dan belum ditinjau penelaah bahasa. Latihan menilai bacaan ketik, bukan pelafalan.</p><p>{{ content.filter(item => item.kind === 'word' && item.language === 'ja').length }} kata Jepang · {{ content.filter(item => item.kind === 'word' && item.language === 'ko').length }} kata Korea · {{ CONTENT_VERSION }}</p><div class="button-row"><a href="https://www.irodori.jpf.go.jp/en/starter/pdf.html" target="_blank" rel="noopener noreferrer" class="text-link">Irodori ↗</a><a href="https://www.korean.go.kr/front_eng/roman/roman_01.do" target="_blank" rel="noopener noreferrer" class="text-link">Romanisasi Korea ↗</a></div></details>
    <ConfirmDialog :open="action !== null" :title="action === 'reset' ? 'Hapus seluruh progres?' : 'Ganti progres saat ini?'" :confirm-label="action === 'reset' ? 'Ya, reset progres' : 'Ya, ganti progres'" :busy="store.busy.value" @cancel="cancel" @confirm="confirm"><p>{{ action === 'reset' ? 'Seluruh riwayat dan pengaturan akan dihapus. Unduh cadangan terlebih dahulu jika ingin menyimpannya.' : `Cadangan berisi ${pendingImport?.sessions.length || 0} sesi. Progres saat ini akan diganti.` }}</p></ConfirmDialog>
  </div>
</template>

<style scoped>
.sound-controls { padding: 4px 0 24px; }
.sound-controls + .setting-row { border-top: 1px solid var(--line); }
.volume-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 13px; font-weight: 650; }
.volume-heading output { color: var(--accent); font-variant-numeric: tabular-nums; }
.sound-controls input[type="range"] { width: 100%; min-height: 44px; margin: 4px 0 12px; padding: 0; accent-color: var(--accent); cursor: pointer; }
.sound-preview { display: flex; align-items: end; gap: 12px; flex-wrap: wrap; }
.sound-preview .field { flex: 1; min-width: 160px; margin: 0; }
.sound-preview .button { min-height: 44px; }
.sound-controls .field-help { margin-top: 12px; }
.is-muted input, .is-muted select { opacity: .55; }
</style>
