export default defineEventHandler((event) => {
  const origin = (useRuntimeConfig(event).public.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
})
