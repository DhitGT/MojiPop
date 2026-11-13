<script setup lang="ts">
import { content, contentById, confusionGroups, scriptLabels } from '~/data/content'
const route = useRoute()
const item = computed(() => contentById[String(route.params.id)])
const revealed = ref(false)
const examples = computed(() => content.filter(candidate => candidate.kind === 'word' && candidate.prerequisites.includes(item.value?.id || '')).slice(0, 3))
const confusions = computed(() => confusionGroups.filter(group => group.ids.includes(item.value?.id || '')))
useHead({ title: computed(() => `${item.value?.glyph || 'Materi'} · KanaLearn`) })
</script>

<template>
  <div v-if="item" class="detail-simple">
    <NuxtLink :to="`/materi?script=${item.script}`" class="text-link">← {{ scriptLabels[item.script] }}</NuxtLink>
    <div class="detail-grid">
      <div class="detail-glyph"><span class="glyph" :lang="item.language">{{ item.glyph }}</span><div v-if="revealed" class="reading">{{ item.answer }}</div><button v-else class="button secondary" @click="revealed = true">Lihat bacaan</button></div>
      <div class="detail-body">
        <h1>{{ item.kind === 'word' ? 'Kata' : item.group }}</h1>
        <template v-if="revealed"><p v-if="item.prompt !== item.glyph"><strong>{{ item.prompt }} → {{ item.answer }}</strong></p><p v-if="item.meaning">{{ item.meaning }}</p><p v-if="item.aliases.length">Jawaban diterima: <strong>{{ [item.answer, ...item.aliases].join(', ') }}</strong></p><p>{{ item.note }}</p></template>
        <p v-else class="muted">Coba ingat bacaannya sebelum membuka jawaban.</p>
        <NuxtLink :to="{ path: '/latihan', query: { script: item.script, kind: item.kind, items: item.id } }" class="button">Latih {{ item.kind === 'letter' ? 'huruf' : 'kata' }} ini <AppIcon name="arrow" :size="16" /></NuxtLink>
        <details v-for="confusion in confusions" :key="confusion.ids.join()" class="disclosure"><summary>Bedakan {{ confusion.ids.map(id => contentById[id]?.glyph).join(' / ') }}</summary><p>{{ confusion.note }}</p><NuxtLink :to="{ path: '/latihan', query: { script: item.script, kind: 'letter', pair: confusion.ids.join(',') } }" class="text-link">Latih pasangan →</NuxtLink></details>
      </div>
    </div>
    <section v-if="revealed && examples.length" class="detail-section"><h2>Contoh kata</h2><NuxtLink v-for="example in examples" :key="example.id" :to="`/materi/${encodeURIComponent(example.id)}`" class="example"><span>{{ example.glyph }}</span><span class="text-accent">{{ example.answer }}</span><small>{{ example.meaning }}</small></NuxtLink></section>
    <details v-if="item.kind === 'word'" class="disclosure"><summary>Huruf penyusun</summary><div class="button-row"><NuxtLink v-for="id in item.prerequisites.filter(id => contentById[id])" :key="id" :to="`/materi/${encodeURIComponent(id)}`" class="button secondary">{{ contentById[id]?.glyph }}</NuxtLink></div></details>
    <details class="disclosure"><summary>Sumber materi</summary><a :href="item.source" target="_blank" rel="noopener noreferrer" class="text-link">{{ item.language === 'ja' ? 'Japan Foundation · Irodori' : 'National Institute of Korean Language' }} ↗</a><p>Versi {{ item.version }} · Draf.</p></details>
  </div>
  <div v-else class="panel empty-state"><h1>Materi tidak ditemukan</h1><NuxtLink to="/materi" class="button">Pilih materi</NuxtLink></div>
</template>
