import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'

// Render the existing brand and mascot with the browser; no image service required.
const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {})
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
  for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<style>html,body{margin:0;background:#683cf2}svg{width:100vw;height:100vh;display:block}</style>${svg}`)
    const png = await page.screenshot()
    if (size === 32) {
      const header = Buffer.alloc(22)
      header.writeUInt16LE(1, 2)
      header.writeUInt16LE(1, 4)
      header[6] = header[7] = 32
      header.writeUInt16LE(1, 10)
      header.writeUInt16LE(32, 12)
      header.writeUInt32LE(png.length, 14)
      header.writeUInt32LE(22, 18)
      await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([header, png]))
    } else await writeFile(new URL(`../public/${name}`, import.meta.url), png)
  }
  const mascot = (await readFile(new URL('../public/images/kiko-mascot.png', import.meta.url))).toString('base64')
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(`<!doctype html><html lang="id"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f8f9ef;color:#23263e;font-family:'Trebuchet MS','Segoe UI',sans-serif}
    main{position:relative;margin:30px;padding:50px;width:1140px;height:570px;border-radius:34px;background:#683cf2;color:white;overflow:hidden}
    .brand{display:flex;align-items:center;gap:18px;font-size:38px;font-weight:900}.brand svg{width:64px;height:64px;border:2px solid #bca6ff;border-radius:20px}
    h1{font-size:58px;line-height:1.12;letter-spacing:-2px;max-width:680px;margin:38px 0 20px}p{font-size:25px;line-height:1.5;color:#eee7ff;margin:0}
    .badge{display:inline-block;margin-top:28px;padding:12px 20px;border-radius:14px;background:#d7fb57;color:#23263e;font-size:21px;font-weight:800}
    img{position:absolute;right:12px;bottom:28px;width:385px;height:385px;object-fit:contain}.star{position:absolute;right:80px;top:48px;color:#d7fb57;font-size:70px}
    </style><main><div class="brand">${svg}<span>KanaLearn</span></div><h1>Mulai dari huruf.<br>Jepang & Korea.</h1><p>Hiragana · Katakana · Hangul<br>Kartu belajar & latihan singkat</p><span class="badge">Tanpa akun. Belajar sesuai ritmemu.</span><span class="star">✦</span><img src="data:image/png;base64,${mascot}" alt="Kiko"></main></html>`)
  await page.locator('img').evaluate(image => image.decode())
  await writeFile(new URL('../public/images/og-kanalearn.png', import.meta.url), await page.screenshot())
} finally {
  await browser.close()
}
