export default defineNuxtConfig({
  devServer: {
    port: 3333,
  },
  compatibilityDate: "2026-11-13",
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  ui: { fonts: false },
  css: ["~/assets/css/main.css", "~/assets/css/game.css"],
  app: {
    head: {
      htmlAttrs: { lang: "id" },
      title: "KanaLearn",
      meta: [
        { name: "description", content: "Kenali hiragana, katakana, dan Hangul melalui kartu dan latihan ketik singkat. Belajar tanpa akun, dengan progres di browsermu." },
      ],  
    },
  },
});
