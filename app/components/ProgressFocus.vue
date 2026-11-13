<script setup lang="ts">
import type { Session } from '~/types/learning'
import { contentById, scriptLabels } from '~/data/content'
import { reviewSummary } from '~/utils/analytics'

const props = defineProps<{ sessions: Session[] }>()
const focus = computed(() => reviewSummary(props.sessions).flatMap(row => {
  const item = contentById[row.itemId]
  return item ? [{ ...row, item }] : []
}))
const practiced = computed(() => props.sessions.some(session => session.attempts.length > 0))
const category = ref('all')
const categories = [
  { value: 'all', label: 'Semua materi' },
  { value: 'letter', label: 'Huruf tunggal' },
  { value: 'combination', label: 'Kombinasi' },
  { value: 'word', label: 'Kata' }
]
const filtered = computed(() => focus.value.filter(row => {
  if (category.value === 'all') return true
  if (category.value === 'word') return row.item.kind === 'word'
  const combination = row.item.group === 'Kombinasi kecil'
  return row.item.kind === 'letter' && (category.value === 'combination' ? combination : !combination)
}))
const visible = computed(() => filtered.value.slice(0, 5))
</script>

<template>
  <section class="panel progress-focus" aria-labelledby="focus-heading">
    <div class="focus-heading">
      <h2 id="focus-heading">Fokus latihanmu</h2>
      <span v-if="filtered.length" class="pill orange">{{ filtered.length }} perlu diulang</span>
    </div>
    <div class="field focus-filter">
      <label for="focus-category">Jenis materi</label>
      <select id="focus-category" v-model="category">
        <option v-for="option in categories" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>
    <template v-if="filtered.length">
      <p class="focus-copy">Mulai dari {{ visible.map(row => row.item.glyph).join(', ') }}. Ini materi yang masih salah, dibantu, atau dilewati pada percobaan terbaru.</p>
      <ul class="focus-list">
        <li v-for="row in visible" :key="row.itemId">
          <NuxtLink :to="`/materi/${encodeURIComponent(row.itemId)}`" class="focus-glyph" :aria-label="`Detail ${row.item.glyph}, ${row.item.answer}`">{{ row.item.glyph }}</NuxtLink>
          <div class="focus-detail">
            <strong>{{ row.item.answer }} <span>· {{ scriptLabels[row.item.script] }}</span></strong>
            <p>{{ row.reason }} dari {{ row.total }} percobaan</p>
            <small>{{ row.provisional ? 'Data awal · ' : '' }}{{ Math.round(row.accuracy) }}% benar mandiri</small>
          </div>
          <NuxtLink :to="{ path: '/latihan', query: { script: row.item.script, kind: row.item.kind, items: row.itemId, mode: 'relaxed' } }" class="text-link focus-practice" :aria-label="`Latih ${row.item.glyph}`">Latih <span aria-hidden="true">→</span></NuxtLink>
        </li>
      </ul>
      <p v-if="filtered.length > visible.length" class="focus-copy">Menampilkan 5 prioritas dari {{ filtered.length }} materi dalam pilihan ini. Rincian lainnya ada di tabel di bawah.</p>
      <p class="focus-note">Berdasarkan maksimal 10 percobaan terakhir per materi. Setelah 3 jawaban mandiri benar beruntun, materi keluar dari ringkasan ini.</p>
    </template>
    <p v-else-if="category !== 'all'" class="focus-copy">Belum ada {{ categories.find(option => option.value === category)?.label.toLowerCase() }} yang perlu diulang dari latihanmu. Pilih jenis lain atau lanjutkan latihan untuk melengkapi progres.</p>
    <p v-else class="focus-copy">{{ practiced ? 'Belum ada materi yang perlu diulang dari percobaan terbaru. Lanjutkan latihan untuk melihat bacaan yang sudah konsisten.' : 'Selesaikan beberapa soal dulu. Huruf dan kombinasi yang perlu diulang akan muncul di sini.' }}</p>
  </section>
</template>

<style scoped>
.progress-focus { margin-top: 22px; }
.focus-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.focus-heading h2 { margin: 0; }
.focus-filter { margin-top: 16px; max-width: 240px; }
.focus-copy { color: var(--muted); font-size: 13px; line-height: 1.7; margin: 12px 0 0; }
.focus-list { list-style: none; padding: 0; margin: 16px 0; }
.focus-list li { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.focus-list li:first-child { padding-top: 0; }
.focus-glyph { display: grid; place-items: center; flex-shrink: 0; min-width: 64px; min-height: 60px; padding: 6px; border-radius: 12px; background: var(--accent-light); color: var(--ink); font-size: 28px; }
.focus-detail { flex: 1; min-width: 0; }
.focus-detail strong { font-size: 14px; }
.focus-detail strong span, .focus-detail small { color: var(--muted); font-size: 11px; font-weight: 400; }
.focus-detail p { font-size: 12px; margin: 5px 0; }
.focus-practice { flex-shrink: 0; min-height: 44px; display: flex; align-items: center; gap: 8px; }
.focus-note { font-size: 11px; line-height: 1.7; color: var(--muted); margin: 0; }
@media (max-width: 480px) {
  .focus-list li { gap: 10px; }
  .focus-glyph { min-width: 52px; font-size: 24px; }
  .focus-detail strong span { display: block; margin-top: 3px; }
}
</style>
