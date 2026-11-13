export default defineNuxtConfig({
  devServer: {
    port: 3333,
  },
  compatibilityDate: "2026-11-13",
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  ui: { fonts: false },
  css: ["~/assets/css/main.css", "~/assets/css/game.css"],
  runtimeConfig: {
    public: { siteUrl: "" },
  },
  app: {
    head: {
      htmlAttrs: { lang: "id" },
      title: "KanaLearn",
      meta: [
        { name: "theme-color", content: "#683cf2" },
        { name: "application-name", content: "KanaLearn" },
        { name: "apple-mobile-web-app-title", content: "KanaLearn" },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },
});
