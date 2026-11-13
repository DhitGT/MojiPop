<script setup lang="ts">
import { achievementTracks } from '~/utils/achievements'
const progress = useAchievements()
const inbox = useAchievementInbox()
const newlyEarnedIds = ref<string[]>([])
const mounted = ref(false)
const newlyEarned = computed(() => progress.value.achievements.filter(entry => entry.unlocked && newlyEarnedIds.value.includes(entry.id)))
function showNewAchievements() {
  if (!mounted.value || !inbox.unread.value.length) return
  newlyEarnedIds.value = [...new Set([...newlyEarnedIds.value, ...inbox.unread.value.map(entry => entry.id)])]
  inbox.markRead()
}
onMounted(() => { mounted.value = true; showNewAchievements() })
watch(() => inbox.unread.value.map(entry => entry.id).join('|'), showNewAchievements)
const groups = computed(() => achievementTracks.map(track => ({
  ...track,
  entries: progress.value.achievements.filter(entry => entry.track === track.id),
  earned: progress.value.achievements.filter(entry => entry.track === track.id && entry.unlocked).length,
})))
</script>

<template>
  <div class="achievement-page">
    <div class="page-heading"><div><span class="eyebrow">Koleksi pencapaianmu</span><h1>Achievement</h1><p>Kepala maskot spesial untuk setiap langkah belajarmu.</p></div><span class="achievement-total"><AppIcon name="trophy" :size="18" />{{ progress.unlocked }} diraih</span></div>
    <section v-if="newlyEarned.length" class="achievement-new-panel" aria-labelledby="achievement-new-title">
      <h2 id="achievement-new-title">Baru didapat!</h2><p>{{ newlyEarned.length }} pencapaian baru untuk koleksimu.</p>
      <div class="achievement-new-list"><div v-for="entry in newlyEarned" :key="entry.id" class="achievement-new-item"><AchievementBadge :category="entry.track" :tier="entry.tier" :label="entry.name" /><div><strong>{{ entry.name }}</strong><span>{{ entry.target.toLocaleString('id-ID') }} {{ entry.unit }}</span></div></div></div>
    </section>
    <section v-for="group in groups" :key="group.id" class="achievement-group" :aria-labelledby="`achievement-${group.id}`">
      <div class="achievement-group-heading"><h2 :id="`achievement-${group.id}`">{{ group.name }}</h2><span>{{ group.earned }} / {{ group.entries.length }} diraih</span></div>
      <p class="achievement-group-description">{{ group.description }}</p>
      <div class="achievement-gallery">
        <article v-for="entry in group.entries" :key="entry.id" class="achievement-row" :class="entry.unlocked ? 'is-earned' : 'is-locked'" :data-achievement="entry.id">
          <div class="achievement-portrait"><AchievementBadge :category="entry.track" :tier="entry.tier" :silhouette="!entry.unlocked" :label="entry.unlocked ? `${group.name}, level ${entry.tier}, diraih` : 'Achievement terkunci'" /></div>
          <div class="achievement-copy"><span class="achievement-level">Level {{ entry.tier }}</span><h3 v-if="entry.unlocked">{{ entry.target.toLocaleString('id-ID') }} {{ entry.unit }}</h3><span v-else class="achievement-secret" aria-hidden="true">???</span><span class="achievement-status"><AppIcon :name="entry.unlocked ? 'check' : 'lock'" :size="13" />{{ entry.unlocked ? newlyEarnedIds.includes(entry.id) ? 'Baru diraih' : 'Sudah diraih' : 'Belum terbuka' }}</span></div>
        </article>
      </div>
    </section>
    <p class="achievement-footnote">Jepang & Korea dihitung bersama. Achievement yang sudah diraih tetap tersimpan meski streak terputus.</p>
  </div>
</template>
