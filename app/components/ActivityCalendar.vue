<script setup lang="ts">
import type { Session } from '~/types/learning'
import { activityCalendar, activityLevel, dailyActivity, emptyActivityDay, localDateKey } from '~/utils/activity'
import { duration } from '~/utils/learning'

const props = defineProps<{ sessions: Session[] }>()
const today = ref(localDateKey(new Date()))
const year = ref(Number(today.value.slice(0, 4)))
const selected = ref(today.value)
const tiles = ref<HTMLElement>()
const popover = ref<HTMLElement>()
const popoverOpen = ref(false)
const popoverPosition = ref({ left: '0px', top: '0px' })
const activity = computed(() => dailyActivity(props.sessions))
const years = computed(() => [...new Set([Number(today.value.slice(0, 4)), ...[...activity.value.keys()].filter(key => key <= today.value).map(key => Number(key.slice(0, 4)))])].sort((a, b) => b - a))
const weeks = computed(() => activityCalendar(year.value))
const detail = computed(() => activity.value.get(selected.value) ?? emptyActivityDay(selected.value))
const daySessions = computed(() => props.sessions.filter(session => detail.value.sessionIds.includes(session.id)))
const formatDate = (key: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(`${key}T12:00:00`))
const count = (key: string) => activity.value.get(key)?.sessionIds.length ?? 0
const label = (key: string) => `${formatDate(key)}: ${count(key)} sesi latihan, ${activity.value.get(key)?.total ?? 0} jawaban`
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthLabels = computed(() => weeks.value.map((week, index) => {
  const first = week.find(key => key?.endsWith('-01'))
  return first ? { index, label: months[Number(first.slice(5, 7)) - 1] } : null
}).filter(entry => entry !== null))

const closeDetail = () => popover.value?.hidePopover()
watch(year, value => { closeDetail(); selected.value = value === Number(today.value.slice(0, 4)) ? today.value : `${value}-12-31` })
watch(years, values => { if (!values.includes(year.value)) year.value = Number(today.value.slice(0, 4)) })
watch(() => props.sessions, closeDetail)
onMounted(() => {
  today.value = localDateKey(new Date())
  nextTick(() => tiles.value?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }))
  window.addEventListener('resize', closeDetail)
  tiles.value?.addEventListener('scroll', closeDetail)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', closeDetail)
  tiles.value?.removeEventListener('scroll', closeDetail)
})
async function showDetail(event: MouseEvent, key: string) {
  selected.value = key
  const anchor = (event.currentTarget as HTMLElement).getBoundingClientRect()
  await nextTick()
  popover.value?.showPopover()
  const box = popover.value?.getBoundingClientRect()
  if (!box) return
  popoverPosition.value = {
    left: `${Math.max(12, Math.min(anchor.left - box.width / 2, window.innerWidth - box.width - 12))}px`,
    top: `${Math.max(12, anchor.bottom + box.height + 10 <= window.innerHeight ? anchor.bottom + 10 : anchor.top - box.height - 10)}px`
  }
}
function navigate(event: KeyboardEvent, key: string) {
  const offsets: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }
  const offset = offsets[event.key]
  if (offset === undefined) return
  event.preventDefault()
  const date = new Date(`${key}T12:00:00`)
  date.setDate(date.getDate() + offset)
  const next = localDateKey(date)
  if (date.getFullYear() !== year.value || next > today.value) return
  closeDetail()
  selected.value = next
  nextTick(() => tiles.value?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus())
}
</script>

<template>
  <section class="panel activity-calendar" aria-labelledby="activity-title">
    <div class="activity-heading">
      <h2 id="activity-title">Aktivitas latihan</h2>
      <div class="activity-year"><label for="activity-year">Tahun</label><select id="activity-year" v-model.number="year"><option v-for="value in years" :key="value" :value="value">{{ value }}</option></select></div>
    </div>
    <div ref="tiles" class="activity-scroll" role="group" aria-label="Kalender aktivitas latihan. Pilih hari untuk detail, gunakan tombol panah untuk berpindah hari.">
      <div class="activity-grid" :style="{ '--weeks': weeks.length }">
        <div class="activity-months" aria-hidden="true"><span v-for="month in monthLabels" :key="month.index" :style="{ gridColumn: month.index + 1 }">{{ month.label }}</span></div>
        <div class="activity-weekdays" aria-hidden="true"><span>Sen</span><span>Rab</span><span>Jum</span><span>Min</span></div>
        <div class="activity-weeks">
          <div v-for="(week, index) in weeks" :key="index" class="activity-week">
            <template v-for="(key, dayIndex) in week" :key="dayIndex">
              <button v-if="key && key <= today" type="button" class="activity-tile" :class="{ 'is-today': key === today }" :data-level="activityLevel(count(key))" :data-date="key" :aria-label="label(key)" :title="label(key)" :aria-pressed="selected === key" :aria-expanded="popoverOpen && selected === key" aria-controls="activity-day-detail" :tabindex="selected === key ? 0 : -1" @click="showDetail($event, key)" @keydown="navigate($event, key)" />
              <span v-else class="activity-tile" :class="{ 'is-future': key }" aria-hidden="true" />
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="activity-legend" aria-label="Kepekatan: 0, 1, 2–3, 4–5, atau 6 sesi ke atas"><span>Sedikit</span><i v-for="level in [0, 1, 2, 3, 4]" :key="level" class="activity-tile" :data-level="level" :title="['0 sesi', '1 sesi', '2–3 sesi', '4–5 sesi', '6+ sesi'][level]" /><span>Banyak</span></div>
    <div id="activity-day-detail" ref="popover" popover class="activity-detail" :style="popoverPosition" role="dialog" aria-labelledby="activity-day-title" @toggle="popoverOpen = $event.newState === 'open'">
      <div class="activity-detail-heading"><h3 id="activity-day-title">{{ formatDate(selected) }}</h3><button type="button" class="activity-close" aria-label="Tutup detail hari" @click="closeDetail">×</button></div>
      <template v-if="detail.total">
        <div class="activity-detail-stats"><span><strong>{{ detail.sessionIds.length }}</strong> sesi latihan</span><span><strong>{{ detail.total }}</strong> jawaban</span><span><strong>{{ Math.round(detail.correct / detail.total * 100) }}%</strong> akurasi mandiri</span><span><strong>{{ duration(detail.responseMs) }}</strong> waktu menjawab</span></div>
        <p class="activity-caption">{{ detail.correct }} benar mandiri · {{ detail.wrong }} salah · {{ detail.assisted }} dibantu · {{ detail.skipped }} dilewati</p>
        <div class="activity-session-links"><NuxtLink v-for="(session, index) in daySessions" :key="session.id" :to="`/hasil/${session.id}`" class="text-link">Lihat sesi {{ index + 1 }} ↗</NuxtLink></div>
      </template>
      <p v-else class="activity-caption">Belum ada latihan pada hari ini.</p>
    </div>
  </section>
</template>

<style scoped>
.activity-calendar { min-width: 0; margin-block: 24px; }
.activity-heading, .activity-detail-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.activity-heading { margin-bottom: 20px; }.activity-heading h2 { font-size: 16px; }.activity-caption { font-size: 11px; color: var(--muted); line-height: 1.7; margin-top: 10px; }
.activity-year { display: flex; align-items: center; gap: 8px; font-size: 12px; }.activity-year select { padding: 7px 10px; min-height: 36px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink); }
.activity-scroll { overflow-x: auto; padding: 4px 3px 10px; }.activity-grid { display: grid; grid-template-columns: 30px 1fr; grid-template-rows: 20px 1fr; gap: 4px 8px; min-width: 760px; }
.activity-months { grid-column: 2; display: grid; grid-template-columns: repeat(var(--weeks), minmax(0, 1fr)); gap: 4px; font-size: 10px; color: var(--muted); }.activity-months span { white-space: nowrap; }
.activity-weekdays { grid-row: 2; display: grid; grid-template-rows: repeat(7, minmax(0, 1fr)); gap: 4px; font-size: 9px; color: var(--muted); align-items: center; }.activity-weekdays span:nth-child(2) { grid-row: 3; }.activity-weekdays span:nth-child(3) { grid-row: 5; }.activity-weekdays span:nth-child(4) { grid-row: 7; }
.activity-weeks { grid-column: 2; grid-row: 2; display: grid; grid-template-columns: repeat(var(--weeks), minmax(0, 1fr)); gap: 4px; }.activity-week { display: grid; grid-template-rows: repeat(7, 1fr); gap: 4px; }
.activity-tile { display: block; aspect-ratio: 1; border-radius: 3px; border: 1px solid transparent; padding: 0; min-width: 0; }.activity-tile[data-level="0"] { background: #eeedf4; border-color: #e5e3ed; }.activity-tile[data-level="1"] { background: #d6cafa; }.activity-tile[data-level="2"] { background: #b39aeb; }.activity-tile[data-level="3"] { background: #8b69d3; }.activity-tile[data-level="4"] { background: #5e3ba7; }
button.activity-tile { cursor: pointer; touch-action: manipulation; }button.activity-tile:hover { outline: 2px solid var(--accent); outline-offset: 1px; }.activity-tile.is-today { border-color: #5e3ba7; }.activity-tile[aria-pressed="true"], button.activity-tile:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }.activity-tile.is-future { border-color: var(--line); background: #faf9fc; }
.activity-legend { display: flex; justify-content: flex-end; gap: 4px; align-items: center; font-size: 10px; color: var(--muted); margin-top: 10px; }.activity-legend .activity-tile { width: 12px; }.activity-legend span { margin-inline: 3px; }
.activity-detail { position: fixed; inset: auto; margin: 0; width: min(320px, calc(100vw - 24px)); max-height: min(360px, calc(100dvh - 24px)); overflow-y: auto; padding: 16px; background: white; color: var(--ink); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 8px 30px #26263d22; }.activity-detail::backdrop { background: transparent; }.activity-detail-heading h3 { font-size: 12px; font-weight: 600; }.activity-close { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 6px; color: var(--muted); font-size: 20px; cursor: pointer; }.activity-close:hover { background: var(--accent-light); }.activity-detail-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; font-size: 11px; color: var(--muted); }.activity-detail-stats strong { color: var(--ink); }.activity-session-links { display: flex; gap: 10px 18px; flex-wrap: wrap; margin-top: 12px; font-size: 11px; }
</style>
