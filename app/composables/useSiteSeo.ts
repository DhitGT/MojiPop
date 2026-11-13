import { contentById, scriptLabels } from '~/data/content'

export function useSiteSeo() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()
  const origin = (config.public.siteUrl || requestUrl.origin).replace(/\/$/, '')
  const pages: Record<string, { title: string; description: string; private?: boolean }> = {
    '/': {
      title: 'KanaLearn · Belajar Hiragana, Katakana & Hangul',
      description: 'Belajar membaca huruf Jepang dan Korea lewat kartu Hiragana, Katakana, Hangul, dan latihan singkat. Tanpa akun, progres tersimpan di browsermu.',
    },
    '/materi': {
      title: 'Materi Hiragana, Katakana & Hangul · KanaLearn',
      description: 'Pelajari huruf dan kata Jepang serta Korea lewat kartu belajar, jalur lima huruf, contoh kata, dan panduan romanisasi di KanaLearn.',
    },
    '/latihan': {
      title: 'Latihan Huruf Jepang & Korea · KanaLearn',
      description: 'Uji bacaan Hiragana, Katakana, dan Hangul dengan latihan ketik atau pilihan ganda. Pilih mode Santai, Time Attack, atau Sprint 60 detik.',
    },
    '/arena': { title: 'Arena latihan · KanaLearn', description: 'Sesi latihan membaca huruf dan kata Jepang atau Korea.', private: true },
    '/progres': { title: 'Progres saya · KanaLearn', description: 'Lihat riwayat latihan, akurasi, dan perkembangan belajarmu di browser ini.', private: true },
    '/pengaturan': { title: 'Pengaturan · KanaLearn', description: 'Atur preferensi belajar dan cadangkan progres KanaLearn di browser ini.', private: true },
  }
  const metadata = computed(() => {
    const path = route.path.replace(/\/$/, '') || '/'
    if (pages[path]) return pages[path]!
    if (path.startsWith('/materi/')) {
      const item = contentById[String(route.params.id)]
      if (item) return {
        title: `${item.glyph} (${item.answer}) · ${scriptLabels[item.script]} · KanaLearn`,
        description: `Pelajari ${item.kind === 'word' ? 'kata' : 'huruf'} ${item.glyph} dalam ${scriptLabels[item.script]}, dibaca ${item.answer}.${item.meaning ? ` Artinya: ${item.meaning}.` : ''} Lihat kartu dan latih bacaanmu di KanaLearn.`,
      }
    }
    return {
      title: path.startsWith('/hasil/') ? 'Hasil latihan · KanaLearn' : 'Halaman tidak ditemukan · KanaLearn',
      description: path.startsWith('/hasil/') ? 'Ringkasan hasil latihan dan jawaban dari sesi belajarmu.' : 'Temukan materi dan latihan huruf Jepang serta Korea di KanaLearn.',
      private: true,
    }
  })
  const canonical = computed(() => `${origin}${route.path.replace(/\/$/, '') || '/'}`)
  useSeoMeta({
    title: () => metadata.value.title,
    description: () => metadata.value.description,
    robots: () => metadata.value.private || route.query.retry || route.query.repeat ? 'noindex, follow' : 'index, follow',
    ogType: 'website',
    ogSiteName: 'KanaLearn',
    ogLocale: 'id_ID',
    ogTitle: () => metadata.value.title,
    ogDescription: () => metadata.value.description,
    ogUrl: () => canonical.value,
    ogImage: `${origin}/images/og-kanalearn.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'KanaLearn — belajar huruf Jepang dan Korea bersama Kiko',
    twitterCard: 'summary_large_image',
    twitterTitle: () => metadata.value.title,
    twitterDescription: () => metadata.value.description,
    twitterImage: `${origin}/images/og-kanalearn.png`,
    twitterImageAlt: 'KanaLearn — belajar huruf Jepang dan Korea bersama Kiko',
  })
  useHead(() => ({
    link: [{ rel: 'canonical', href: canonical.value }],
    script: route.path === '/' ? [{
      key: 'website-schema',
      type: 'application/ld+json',
      textContent: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: 'KanaLearn', url: `${origin}/`, inLanguage: 'id',
        description: pages['/']!.description,
      }).replace(/</g, '\\u003c'),
    }] : [],
  }))
}
