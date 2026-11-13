<script setup lang="ts">
const store = useLearningStore()
const route = useRoute()
const achievementInbox = useAchievementInbox()
const links = [
  { to: '/belajar', label: 'Beranda', icon: 'home', color: '#f06595' },
  { to: '/perjalanan', label: 'Perjalanan Belajar', icon: 'target', color: '#e8590c' },
  { to: '/materi', label: 'Materi', icon: 'book', color: '#1c7ed6' },
  { to: '/latihan', label: 'Latihan', icon: 'play', color: '#2f9e44' },
  { to: '/typing-race', label: 'Typing Race', icon: 'bolt', color: '#d9a400' },
  { to: '/progres', label: 'Progres', icon: 'chart', color: '#0ca678' },
  { to: '/raport', label: 'Raport', icon: 'report', color: '#7048e8' },
  { to: '/achievement', label: 'Achievement', icon: 'trophy', color: '#f08c00' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'settings', color: '#5c7cfa' }
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
      <nav aria-label="Navigasi utama" :style="{ '--nav-count': links.length + 1 }">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" :style="{ '--link-c': link.color }" :class="{ active: link.to === '/' ? route.path === '/' : route.path.startsWith(link.to) }"><span class="nav-icon"><AppIcon :name="link.icon" :size="22" /><span v-if="link.to === '/achievement' && achievementInbox.unread.value.length" class="achievement-alert-dot" role="status" :aria-label="`${achievementInbox.unread.value.length} achievement baru belum dilihat`" /></span><span>{{ link.label }}</span></NuxtLink>
        <a href="https://forms.gle/pX87UedPFWFYH2af6" target="_blank" rel="noopener noreferrer" style="--link-c: #15aabf"><span class="nav-icon"><AppIcon name="message" :size="22" /></span><span>Masukan dan Saran</span></a>
      </nav>
      <SidebarCompanion />
    </aside>
    <AchievementNotification />
    <div class="main-shell">
      <header v-if="!arena" class="mobile-brand"><NuxtLink to="/" class="brand"><span class="brand-mark">か</span><span>Kana<span class="text-accent">Learn</span></span></NuxtLink></header>
      <div class="theme-toolbar"><ThemeToggle /></div>
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

<style scoped>
.sidebar nav a .nav-icon { color: var(--link-c); }
.sidebar nav a:hover { background: color-mix(in srgb, var(--link-c) 12%, transparent); }
.sidebar nav a.active { background: color-mix(in srgb, var(--link-c) 18%, transparent); color: var(--link-c); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--link-c) 35%, transparent); }
.sidebar nav a:focus-visible { outline: 2px solid var(--link-c); outline-offset: 2px; }
@media (max-width: 680px) {
  .sidebar nav { grid-template-columns: repeat(var(--nav-count), minmax(60px, 1fr)); overflow-x: auto; padding-bottom: 3px; }
  .sidebar nav a { font-size: 8px; text-align: center; overflow-wrap: anywhere; }
}
</style>