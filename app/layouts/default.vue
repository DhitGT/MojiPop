<script setup lang="ts">
const store = useLearningStore()
const route = useRoute()
const links = [
  { to: '/', label: 'Beranda', icon: 'home' },
  { to: '/materi', label: 'Materi', icon: 'book' },
  { to: '/latihan', label: 'Latihan', icon: 'play' },
  { to: '/progres', label: 'Progres', icon: 'chart' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'settings' }
]
onMounted(() => store.init())
const arena = computed(() => route.path === '/arena')
const publicContent = computed(() => route.path === '/' || route.path === '/materi' || route.path.startsWith('/materi/'))
</script>

<template>
  <div class="app-shell" :class="{ 'reduce-motion': store.data.value.settings.reducedMotion, 'arena-shell': arena }">
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <aside v-if="!arena" class="sidebar">
      <NuxtLink to="/" class="brand" aria-label="KanaLearn beranda"><span class="brand-mark">か</span><span>Kana<span class="text-accent">Learn</span></span></NuxtLink>
      <nav aria-label="Navigasi utama">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" :class="{ active: link.to === '/' ? route.path === '/' : route.path.startsWith(link.to) }"><span class="nav-icon"><AppIcon :name="link.icon" :size="22" /></span><span>{{ link.label }}</span></NuxtLink>
      </nav>
      <div class="sidebar-companion" aria-hidden="true"><KikoMascot decorative /><span>KIKO</span></div>
    </aside>
    <div class="main-shell">
      <header v-if="!arena" class="mobile-brand"><NuxtLink to="/" class="brand"><span class="brand-mark">か</span><span>Kana<span class="text-accent">Learn</span></span></NuxtLink></header>
      <main id="main" tabindex="-1" :class="['main-content', { 'arena-main': arena }]">
        <div v-if="store.storageError.value" class="notice danger" role="alert"><strong>Penyimpanan bermasalah</strong><p>{{ store.storageError.value }}</p><button class="text-button" @click="store.exportProgress">Ekspor data sekarang</button></div>
        <slot v-if="store.ready.value || publicContent" />
        <div v-else-if="route.path === '/latihan'" class="panel">
          <h1>Latihan huruf Jepang & Korea</h1>
          <p>Latih bacaan Hiragana, Katakana, dan Hangul lewat latihan ketik atau pilihan ganda. Pilih mode Santai, Time Attack, atau Sprint 60 detik.</p>
          <NuxtLink to="/materi" class="text-link">Pelajari materi terlebih dahulu</NuxtLink>
          <p role="status">Menyiapkan pilihan latihan…</p>
        </div>
        <div v-else class="loading-state" role="status"><span class="brand-mark">か</span><p>Memuat…</p></div>
      </main>
    </div>
  </div>
</template>
