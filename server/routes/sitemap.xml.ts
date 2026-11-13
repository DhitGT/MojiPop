import { content } from '../../app/data/content'

export default defineEventHandler((event) => {
  const origin = (useRuntimeConfig(event).public.siteUrl || getRequestURL(event).origin).replace(/\/$/, '')
  const escapeXml = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
  const paths = ['/', '/materi', '/latihan', ...content.map(item => `/materi/${encodeURIComponent(item.id)}`)]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join('')}</urlset>`
})
