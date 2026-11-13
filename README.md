# KanaLearn

Status pengembangan dan catatan untuk agent berikutnya: [Handoff](app/docs/HANDOFF.md).

Halaman Latihan menyediakan paket siap main dan tab Atur sendiri. Pilihan ganda huruf/kata memakai empat bacaan, feedback merah/hijau, perpindahan otomatis, dan Sprint 60 detik. Hasil menyertakan grafik komposisi jawaban dan akurasi kumulatif; latihan ketik tetap tersedia.

Pemetaan fitur, bukti pengujian, dan pekerjaan sebelum rilis: [Status penerimaan MVP](app/docs/ACCEPTANCE.md).

Alur utama diringkas menjadi pilih bahasa → pelajari lima huruf → latihan. Pilihan lanjutan, penjelasan skor, seluruh jawaban, serta sumber materi tersedia melalui bagian yang bisa dibuka saat dibutuhkan.

Tampilan memakai tema game dengan warna ungu/lime/toska, tombol berlapis, kartu pelajaran berwarna, dan maskot Kiko. Struktur dasar berada di `app/assets/css/main.css`; tema terbaru di `app/assets/css/game.css` (dimuat setelah CSS dasar). [Aset dan prompt maskot](app/docs/MASCOT.md) mendokumentasikan PNG transparan yang dibuat dengan imagegen.

Maskot aktif kembali memakai PNG asli melalui `KikoMascot.vue`, dengan animasi ringan pada gambar utuh dan dukungan pengurangan gerakan. Versi SVG berlapis, desain Kineko, dan dependency GSAP sudah di-revert atas permintaan pengguna.

Aplikasi latihan membaca Jepang dan Korea berbahasa Indonesia, dibangun dengan Nuxt 4, TypeScript, Tailwind CSS 4, dan Nuxt UI 4. Implementasi lokal mengikuti [PRD](app/docs/PRD_Latihan_Jepang_Korea.md).

## Menjalankan proyek

SEO menggunakan judul/deskripsi per halaman, canonical tanpa parameter, Open Graph/Twitter Card, serta `/robots.txt` dan `/sitemap.xml` otomatis. Saat deploy, isi `NUXT_PUBLIC_SITE_URL` dengan domain publik final (lihat `.env.example`) agar canonical, sitemap, dan URL gambar berbagi konsisten. Halaman sesi, hasil, progres, dan pengaturan memakai `noindex`.

Favicon mengikuti logo “か” ungu. Aset PNG/ICO dan gambar berbagi dapat dibuat ulang dengan `node scripts/generate-brand-assets.mjs` menggunakan Playwright (Microsoft Edge di Windows, Chromium di platform lain).

Gunakan Node.js 24 LTS dan npm.

```bash
npm install
npm run dev
```

Buka http://localhost:3333.

Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd` sebagai pengganti `npm`.

## Perintah

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

## Struktur

- `app/pages/`: beranda, materi/kartu, pengaturan latihan, arena, hasil, progres, dan pengaturan data.
- `app/app.vue`: root aplikasi dengan provider `UApp`.
- `app/app.config.ts`: konfigurasi tema Nuxt UI.
- `app/assets/css/main.css`: import Tailwind CSS, Nuxt UI, dan desain responsif.
- `app/data/content.ts`: dataset berversi dan pasangan pembanding terkurasi.
- `app/utils/learning.ts`: aturan jawaban, pool/urutan soal, akurasi, progres, dan rekor.
- `app/utils/storage.ts`: IndexedDB, preferensi lokal, dan validasi impor.
- `app/composables/usePractice.ts`: timer monotonic, siklus soal, bantuan, dan jeda.
- `tests/`: tes aturan inti serta alur browser.
- `nuxt.config.ts`: konfigurasi utama Nuxt.

Integrasi mengikuti [dokumentasi Nuxt UI](https://ui.nuxt.com/docs/getting-started/installation/nuxt).

## Pengalaman belajar

Semua materi terbuka. Pilih kartu, kemudian latihan huruf atau kata dalam mode Santai, Time Attack, atau Sprint 60 detik. Enter mengirim jawaban, Esc menjeda sesi. Salah/lewati menunggu tombol Lanjut; benar lanjut otomatis. Petunjuk membuat soal berstatus dibantu.

Tab tersembunyi menjeda sesi. Saat dilanjutkan, soal belum terjawab diganti (jika pool memiliki alternatif). Jeda dan sesi belum tuntas tidak masuk rekor kecepatan. Benchmark memakai komposisi tetap dengan urutan diacak. Akurasi, median respons, kesalahan, kemungkinan pasangan tertukar, serta latihan ulang tersedia pada hasil.

Jalur belajar membagi seluruh huruf/kombinasi menjadi langkah maksimal lima item, tanpa mengunci akses. Setiap langkah menawarkan kata yang sesuai dengan huruf langkah tersebut dan langkah sebelumnya. Tabel Hangul membedakan nama jamo dari bacaan blok soal.

Riwayat disimpan per sesi di IndexedDB setiap jawaban dan secara berkala selama latihan. Identitas attempt stabil sehingga reload tidak menggandakan hasil. Preferensi kecil memakai localStorage. Data tidak disinkronkan atau dikirim ke server. Cadangan JSON versi skema 1 dapat diekspor/impor dari Pengaturan; impor mengganti seluruh progres setelah konfirmasi dan transaksi IndexedDB yang atomik. Reset juga memerlukan konfirmasi. Jika penyimpanan gagal, data sesi tetap tersedia dalam memori dengan peringatan dan tombol ekspor.

Jawaban baru menyimpan waktu pengiriman (`answeredAt`) sehingga urutan progres tetap benar ketika sesi lama dilanjutkan. Cadangan versi 1 yang belum memiliki timestamp tetap didukung dengan fallback urutan sesi dan attempt.

## Pengujian browser

Di Windows, tes menggunakan Microsoft Edge yang sudah terpasang. Di platform lain, jalankan `npx playwright install chromium` sekali dahulu. Secara default Playwright menjalankan server lokal di port 3210 dan menghentikannya setelah tes.

Jika server proyek sudah berjalan, gunakan URL-nya agar tidak membuat server Nuxt kedua:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3333'
npm.cmd run test:e2e
Remove-Item Env:\PLAYWRIGHT_BASE_URL
```

## Status konten dan batas implementasi

Dataset pengembangan mencakup 46 kana dasar untuk setiap script, dakuten/handakuten, 33 kombinasi kecil per script, lebih dari 60 kata Jepang, 14 konsonan dan 10 vokal Hangul, serta lebih dari 20 kata Korea tanpa batchim. Soal konsonan Korea meminta bacaan dalam blok, bukan nama jamo. Alias jawaban melekat pada tiap item, bukan substitusi global.

**Materi masih draf.** Referensi ada pada setiap item. Dataset dan seluruh alias perlu pemeriksaan oleh penelaah bahasa yang kompeten sebelum diberi status konten rilis. Tes otomatis memeriksa integritas dan aturan; tes tersebut tidak menggantikan peninjauan bahasa.

Tema gelap, efek suara, audio bacaan, sinkronisasi akun, PWA/offline penuh, dan pilot pengguna belum diimplementasikan. Aplikasi tidak membutuhkan request per jawaban; ini tidak menjamin halaman bisa dibuka pertama kali tanpa jaringan.
# MojiPop
