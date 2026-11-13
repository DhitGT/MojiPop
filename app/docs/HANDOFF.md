# Handoff pengembangan KanaLearn

## Terbaru: pilihan ganda dan paket siap main

Perluasan terakhir: 31 paket Jepang dan 17 paket Korea, dikelompokkan sebagai Mulai dari Nol (4 paket per bahasa), Huruf (13 Jepang / 4 Korea), Kata (9 Jepang / 4 Korea), Tantangan (5 per bahasa). Halaman pertama hanya menampilkan kategori pemula. Filter jenis jawaban (pilihan ganda/ketik) dan materi (huruf/kata), jumlah paket, serta empty state/reset filter tersedia. Paket mencakup baris kana, dakuten/handakuten/kombinasi, kata pendek/panjang/tsu kecil/vokal panjang, vokal/konsonan Hangul, Sprint ketik/kata, dan Time Attack 20 soal. Semua paket memakai katalog yang sudah ada; tidak menambah konten bahasa yang belum ditinjau. Tombol kartu “Mulai” langsung menjalankan sesi, label aksesibelnya menyebut nama paket.

Verifikasi katalog terakhir: 15 tes domain lulus, typecheck exit 0, dan 4 tes browser lulus (`e2e-packages.log`) mencakup kategori/filter/empty state, paket Jepang/Korea, pilihan ganda huruf/kata, warna feedback, lanjut otomatis, deadline, grafik, serta persistensi setelah reload. Satu percobaan sebelumnya gagal ketika menjalankan typecheck bersamaan browser: dev server sedang membangun ulang saat reload. Ulang secara berurutan lulus; jangan menjalankan pembangkitan `.nuxt` bersamaan browser dev untuk menghindari gangguan ini.

- `/latihan` tanpa query membuka paket siap main. Jepang: Hiragana Pertama (5 vokal), Hiragana Dasar (15 huruf), Tebak Kata (12 kata pendek), Katakana Dasar, Sprint Campuran, Berani Ketik. Korea memiliki 5 paket sepadan. Definisi ada di `app/data/practicePackages.ts`.
- Paket langsung membuat sesi; tab Atur sendiri mempertahankan semua pengaturan. Link materi/retry/repeat dengan query tetap membuka pengaturan manual. Pilihan ganda otomatis memilih Sprint 60 detik ketika dipilih, tetapi mode lain tetap bisa dipilih manual.
- `PracticeConfig.answerFormat` opsional (`typing`/`choice`); config lama tanpa field ini tetap berarti ketik. Validasi backup menerima keduanya dan kunci pembanding rekor memisahkan format.
- `makeChoices` menyediakan empat jawaban unik dari script/jenis yang sama, mengecualikan alias benar sebagai distractor. Pool latihan satu huruf tetap mendapat distractor dari katalog. Semua item diuji hanya memiliki satu opsi yang diterima.
- Arena pilihan ganda: klik atau angka 1–4; salah merah dan opsi benar hijau, benar hijau; semua hasil berganti otomatis setelah 850 ms. Timer tetap berjalan saat feedback. Jeda/reload dan pencatatan percobaan memakai mekanisme lama.
- `SessionCharts.vue` menampilkan komposisi hasil dan grafik SVG akurasi kumulatif dengan label aksesibel. Grafik dihitung dari jawaban tersimpan; tidak menambah dependency chart.
- Bukti: `npm test` 15 lulus; suite browser awal 16 lulus (`e2e-choice.log`), kemudian 3 tes pilihan ganda/paket lulus (`e2e-packages.log`). Screenshot ponsel di `test-results/practice-packages.png`, `choice-letter.png`, dan `choice-results-letter.png`. Build/typecheck akhir dicatat di `build-choice.log` dan `typecheck-choice.log`.
- Maskot tidak diubah oleh pekerjaan ini.

Dicatat: 13 November 2026, Asia/Jakarta.

**Status terkini: pengembangan sudah dilanjutkan atas permintaan pengguna.** Perubahan dan hasil terbaru ada pada bagian berikut; bagian setelahnya mencatat keadaan pada handoff pertama.

## REVERT TERBARU — kembali sebelum SVG berlapis

Pengguna menghentikan pengembangan lalu meminta: "kembali sebelum SVG CSS keyframe". Target dipulihkan ke Kiko PNG asli dengan animasi ringan gambar utuh, sebelum rig SVG dan GSAP. Jangan melanjutkan implementasi SVG/GSAP/Kineko dari arsip di bawah tanpa permintaan baru.

- Aktif: `KikoMascot.vue` merender `public/images/kiko-mascot.png`; idle/hover/lompatan/perayaan CSS pada gambar utuh dipulihkan. Reduced motion sistem/aplikasi, pause tab/offscreen dan cleanup listener tetap ada.
- `KinekoCharacter.vue`, `KinekoMascot.vue` dan `useKinekoAnimation.ts` dihapus. Komponen, label dan selector kembali Kiko/KIKO. Tidak ada renderer SVG karakter yang aktif.
- GSAP di-uninstall, termasuk perubahan package.json/lockfile. Tema game, warna, kepadatan layout, alur belajar, dataset dan penyimpanan progres tidak di-revert.
- Tes ponsel kembali menunggu PNG selesai didekode. Dokumentasi maskot/README disesuaikan. Verifikasi revert lulus: typecheck exit 0 (`typecheck-mascot-revert.log`), 2 tes desktop/ponsel (`e2e-mascot-revert.log`), build exit 0 dalam 50.9 detik (`build-mascot-revert.log`).

Semua bagian rig SVG/GSAP di bawah adalah arsip perubahan yang telah dibatalkan.

## Rig SVG maskot (koreksi terbaru pengguna)

Pengguna memperjelas bahwa animasi yang diinginkan adalah bagian tubuh bergerak sendiri: mulut buka-tutup dan tangan wave. Animasi PNG utuh sebelumnya tidak memenuhi maksud tersebut.

- Render aktif diganti menjadi `KikoCharacter.vue`, SVG berlapis yang mempertahankan identitas Kiko: kucing toska, telinga koral, bintang kuning, mata besar dan buku ungu. Grup tangan, mulut, mata, ekor, kepala dan buku memiliki keyframe sendiri. PNG awal tetap disimpan sebagai referensi, tidak diedit/dihapus.
- Tangan berputar dari bahu, mulut memakai lapisan senyum tertutup dan cavity terbuka, mata berkedip, ekor bergoyang. Hover/klik mempercepat sapaan/mulut; animasi wrapper tetap menangani lompatan/perayaan. `KikoMascot` meneruskan status paused dan reaction ke SVG.
- Preferensi reduced motion mematikan animasi sampai ke grup SVG. Prop dekoratif, akses keyboard, pause tab/offscreen dan cleanup tetap dipertahankan. Tidak memasang dependency tambahan; GSAP/Rive disebut sebagai opsi library, bukan diklaim dipakai.
- QA berhasil membuktikan tangan dan mulut bergerak independen ketika idle wrapper dimatikan, serta memeriksa keyboard/reduced motion dan tidak ada page error (`kiko-rig-check.log`). Script QA/screenshot sementara: `test-results/kiko-rig-check.mjs` dan `kiko-rig.png`. Jangan memakai screenshot dengan opsi Playwright `animations: disabled` sebelum memeriksa lifecycle native animation, karena opsi itu mengubah timeline.
- Typecheck lulus (`typecheck-kiko-rig.log`). Tiga tes alur desktop/ponsel lulus, exit 0 (`e2e-kiko-rig.log`). Build berhasil, exit 0, 55.2 detik (`build-kiko-rig.log`).

Bagian animasi PNG di bawah adalah arsip versi sebelumnya; SVG berlapis ini adalah implementasi terkini.

## Animasi maskot (permintaan terakhir)

- `KikoMascot.vue` sekarang menggerakkan PNG yang ada melalui wrapper CSS: idle, reaksi hover, lompatan saat klik/keyboard, dan kilau. Root interaktif menjadi tombol berlabel `Sapa Kiko`; varian `decorative` memakai span tanpa fokus keyboard.
- Hasil sesi yang benar-benar selesai mengirim prop `celebrate`, memicu perayaan sekali. Hasil sesi terputus tetap memakai idle.
- Gerakan berhenti saat reduced motion sistem/preferensi aplikasi aktif, tab tersembunyi, atau elemen keluar viewport. Media listener, visibility listener dan IntersectionObserver dibersihkan pada unmount. Tidak ada asset raster atau dependency baru.
- Typecheck lulus (`typecheck-kiko.log`). QA browser terarah lulus untuk idle yang benar-benar bergerak, klik, keyboard, perayaan, hidden tab, serta reduced motion sistem dan aplikasi; tidak ada page error (`kiko-motion-check.log`). Script QA sementara berada di `test-results/kiko-motion-check.mjs` dan bisa hilang saat Playwright membersihkan artefak. Build berhasil, exit 0, 30.7 detik (`build-kiko.log`).

## Tema game dan maskot (permintaan visual terakhir)

Pengguna menilai versi minimal terlalu polos dan banyak ruang kosong. Preferensi terkini: nuansa game belajar seperti Duolingo/Blooket, warna terang/kontras, maskot, layout padat tanpa memperumit alur. Jangan mengembalikan palet pucat seragam atau menambah paragraf motivasi/aturan ke layar utama.

- Tema game ada di `app/assets/css/game.css`, dimuat setelah `main.css` lewat `nuxt.config.ts`. Palet ungu/lime/toska/kuning/koral, outline dan shadow tombol/kartu, ikon lebih tebal. Berlaku pada materi, pengaturan latihan, arena, hasil dan progres.
- Dashboard desktop dua kolom: rekomendasi belajar + kartu tulisan + tiga pintasan mode di utama; target huruf dicoba dan tiga langkah jalur belajar di kanan. Layout menjadi satu kolom pada ponsel. Target dihitung dari attempt mandiri yang ada, bukan XP atau klaim penguasaan buatan.
- Rekomendasi tetap satu CTA utama. Pintasan Santai/Time Attack/Sprint mengirim parameter mode ke halaman `/latihan`; parsing mode query ditambahkan tanpa mengubah aturan sesi/penilaian.
- Kiko adalah maskot kucing toska asli, dibuat dengan built-in `image_gen` dan background transparan. Final ada di `public/images/kiko-mascot.png` (sekitar 1.29 MB), dirender melalui `app/components/KikoMascot.vue`. Dipakai pada hero, sidebar desktop dan hasil sesi. Sumber/prompt lengkap: [MASCOT.md](MASCOT.md). Tidak memakai CLI/API fallback atau aset merek Duolingo/Blooket.
- Screenshot beranda desktop dan ponsel telah dilihat agent. Tes memastikan gambar selesai didekode sebelum screenshot ponsel; hindari menganggap screenshot saat loading sebagai keadaan UI final.
- Verifikasi: 14/14 E2E lulus (`e2e-game.log`, 2 menit), typecheck exit 0 (`typecheck-game.log`). Setelah polesan warna/maskot hasil dan pembaruan tes shortcut, pengujian Sprint + Hangul/mobile lulus 2/2 (`e2e-game-mobile.log`), dan verifikasi final decode asset/mobile lulus 1/1 (`e2e-game-mobile-final.log`). Build akhir berhasil, exit 0, 1 menit 24 detik (`build-game.log`).

Server pengguna di port 3333 tetap dipertahankan, tanpa deployment atau perubahan dependency. Dokumen UX simplifikasi di bawah tetap relevan untuk menjaga alur singkat, tetapi tema visual game pada bagian ini adalah arahan terbaru.

## Pembaruan UX terbaru

Pengguna meminta UX disederhanakan dan teks yang tidak penting dipangkas. Preferensi ini berlaku untuk iterasi berikutnya: gunakan label langsung, satu aksi utama, dan detail opsional; jangan mengembalikan slogan, banner motivasi, atau penjelasan teknis ke alur utama.

- Shell: label navigasi pendek; topbar/avatar semu, slogan/sidebar-note, dan footer dekoratif dihapus. Arena fokus tanpa sidebar atau navigasi bawah.
- Beranda: pilih Jepang/Korea, satu rekomendasi dengan tombol Mulai belajar/Lanjutkan sesi/Ulang kesalahan, kartu tulisan, dan satu keterangan penyimpanan lokal. Statistik kosong dan saran berulang dihapus. Rekomendasi kini menuju langkah spesifik maksimal lima huruf.
- Materi: default lima huruf, dropdown Pelajaran untuk semua langkah termasuk Semua huruf; filter/pencarian di disclosure. Tidak lagi menampilkan seluruh grid dan jalur panjang sekaligus.
- Latihan: satu form ringkas, pilihan mode, materi, jumlah soal dan tombol mulai. Susunan benchmark serta aturan rinci berada di Opsi lainnya. Konteks pasangan terkurasi dan aturan timer Sprint tetap tersedia sebelum mulai.
- Arena: glyph, input, Jawab, petunjuk/lewati, dan feedback singkat. Penjelasan salah dibuka melalui disclosure. Overlay Nuxt DevTools disembunyikan khusus arena karena menutupi input pada viewport pendek.
- Hasil: akurasi/waktu dan aksi ulang ditonjolkan; seluruh jawaban dan formula skor berada di disclosure. Progres, kartu dan pengaturan dipangkas dengan pola sama. Cadangan memakai label Unduh cadangan; reset tetap memerlukan konfirmasi.
- Tes E2E diperbarui untuk label dan lokasi kontrol baru. Mesin penilaian dan skema progres tidak diubah.

Verifikasi UX: 13 skenario browser lulus dalam `e2e-simple.log`. Skenario viewport arena sempat gagal karena overlay pengembangan; setelah perbaikan lulus pada pengujian terarah di `e2e-arena-simple.log`. Typecheck exit 0 (`typecheck-simple.log`). Build akhir seluruh perubahan berhasil dalam 21 detik, exit 0 (`build-simple-final.log`). Screenshot beranda baru telah diperiksa dan muat satu layar desktop; screenshot arena ponsel terbaru juga sudah diperiksa.

## Pembaruan setelah pengguna meminta lanjut

- `Attempt.answeredAt` ditambahkan sebagai field opsional. Jawaban baru menyimpan timestamp; progres per item dan rangkaian benar dihitung menurut waktu jawaban, termasuk ketika sesi lama dilanjutkan setelah sesi baru. Cadangan skema 1 lama tetap bisa dibaca dengan fallback sesi/urutan attempt.
- `app/utils/curriculum.ts` membagi seluruh huruf/kombinasi menjadi langkah maksimal lima item; seluruh langkah terbuka. Halaman Materi menampilkan langkah, kumpulan item terarah, dan kata terkait sesuai prerequisite kumulatif. Nama jamo Hangul ditampilkan terpisah dari bacaan blok. Filter kartu juga menampilkan kelompok dan mendukung pencarian nama jamo.
- Pool item dari latihan terarah sebelumnya tidak lagi terbawa ke pengaturan sesi baru. Pengulangan review pada pool kecil diperbaiki agar tidak berurutan langsung jika tersedia alternatif.
- Ukuran/warna teks sekunder, label status, dan instruksi arena diperjelas. Ini belum merupakan audit WCAG penuh.
- Pengujian baru mencakup Time Attack sampai selesai, tab tersembunyi dan prompt pengganti, pasangan dari hasil, ekspor/reset/impor valid, storage quota failure, jalur belajar dan regresi pool, reload saat feedback, serta rotasi/viewport ponsel pendek dengan reduced motion.
- Pemetaan setiap acceptance criterion, bukti pengujian dan batas rilis ada di [ACCEPTANCE.md](ACCEPTANCE.md). README diperbarui.

**Verifikasi terakhir pada source saat ini:**

| Pemeriksaan | Hasil | Bukti lokal |
| --- | --- | --- |
| `npm.cmd test` | 12/12 lulus | `tests/learning.test.mjs` |
| `npm.cmd run typecheck` | Exit 0 | `typecheck-resume.log` |
| Playwright Edge | 14 passed (3.4m), exit 0 | `e2e-final.log` |
| `npm.cmd run build` | Berhasil, 3m 23s, exit 0 | `build-resume.log` |

Browser memakai server pengguna `http://[::1]:3333` melalui `PLAYWRIGHT_BASE_URL`. Server pengguna tidak dihentikan. Tidak ada dependency baru, deployment, commit, atau PR pada pekerjaan lanjutan. Screenshot beranda terbaru dan arena ponsel pendek telah dilihat agent; tidak ada overflow horizontal pada viewport yang diuji.

Prioritas yang masih terbuka: review bahasa seluruh kata/alias, pilot perangkat fisik dan browser lain, audit aksesibilitas lengkap, pengukuran target feedback 100 ms pada perangkat yang disepakati, serta evaluasi audit dependency. UI konten tetap berlabel draf. Tema gelap/suara dan fitur lanjutan tetap belum dikerjakan.

Catatan lanjutan kecil: rekomendasi kelompok di beranda masih memakai kelompok asli dataset; jalur Materi sendiri sudah membagi semua kelompok menjadi langkah maksimal lima item. Rekomendasi beranda dapat diarahkan ke langkah spesifik pada iterasi berikutnya.

## Arsip handoff pertama

## Tujuan dan konteks

Pengguna telah meminta:
1. Setup Nuxt dengan Tailwind CSS dan Nuxt UI.
2. Mulai membangun aplikasi berdasarkan `app/docs/PRD_Latihan_Jepang_Korea.md`.
3. Jeda dan catat progres untuk handoff.

Repository/workspace: `C:\CODE\KanaLearn`, Windows PowerShell, Node 24.21.0. Implementasi berada langsung di workspace ini; tidak ada deployment, commit, atau PR yang dibuat oleh agent. Pada pemeriksaan awal workspace tidak memiliki `.git`. Jangan menghapus atau menimpa perubahan pengguna.

PRD tetap menjadi sumber kebutuhan. Implementasi ini merupakan MVP pengembangan, belum dinyatakan memenuhi seluruh kriteria penerimaan rilis. Peninjauan bahasa oleh penelaah kompeten dan pilot pengguna belum dilakukan.

## Yang sudah diimplementasikan

- Nuxt 4.6.4, Vue 3.5.45, Vue Router 5.5.0, Tailwind CSS 4.3.5, Nuxt UI 4.12.0, TypeScript 6, vue-tsc, dan Playwright.
- Root `UApp`, layout bersama, sidebar desktop, navigasi bawah ponsel, tautan lewati konten, gaya pastel ungu/peach/mint, ikon SVG lokal, reduced motion sistem dan preferensi lokal.
- Beranda: pemilihan Jepang/Korea, statistik dari data nyata, rekomendasi kelompok, lanjut sesi belum selesai, dan ulang kesalahan terakhir.
- Materi: filter sistem tulisan/kelompok/jenis, pencarian, sembunyikan romanisasi, kartu detail, contoh kata, referensi, tautan latihan item dan pasangan.
- Pengaturan latihan: huruf/kata, kelompok, 10/20/30 soal, sesi bebas Santai, tiga mode, paket acak atau benchmark dengan komposisi tetap dan urutan diacak.
- Arena: input Latin, Enter/kirim eksplisit, normalisasi case/spasi tepi, alias per item, jawaban kosong tidak dikirim, petunjuk berstatus dibantu, lewati terpisah, benar lanjut otomatis, salah/lewati menunggu Lanjut.
- Timer menggunakan `performance.now()`, durasi aktif termasuk feedback, Sprint 60 detik, prompt terbuka saat habis menjadi tidak selesai. Tab tersembunyi/Esc/tombol jeda menjeda sesi. Saat melanjutkan, prompt diganti jika ada alternatif; sesi dijeda tidak memenuhi syarat rekor.
- Sesi yang diakhiri sebelum target berstatus interrupted dan tidak menjadi rekor. Santai bebas bisa diselesaikan manual.
- Hasil: hitungan per outcome, akurasi mandiri, median respons benar mandiri, durasi, seluruh attempt, item salah, pasangan terkurasi yang mungkin tertukar, ulang kesalahan, ulang paket, perbandingan konfigurasi yang sama.
- Ulang kesalahan: sekitar 70% item salah/lewati, sisanya item yang dijawab benar dari kelompok yang sama pada sesi asal. Menyesuaikan pool; pool kecil diberi informasi pengulangan.
- Inferensi pasangan hanya jika jawaban salah cocok unik dengan item lain pada script yang sama dan keduanya berada dalam pasangan terkurasi. Tidak menyimpulkan kesalahan huruf dari kesalahan kata.
- Progres: riwayat sesi, statistik item/kata terpisah, status belajar sesuai aturan PRD, pencapaian sesi pertama dan 20 benar beruntun.
- IndexedDB menyimpan sesi setiap attempt dan heartbeat sekitar 5 detik; localStorage menyimpan preferensi. Attempt ber-ID stabil. Sesi aktif ditemukan setelah reload menjadi interrupted. Ada peringatan storage gagal dan ekspor data memori.
- Ekspor JSON, impor tervalidasi versi skema 1 (mengganti progres setelah konfirmasi), transaksi penggantian IndexedDB atomik, reset dengan dialog konfirmasi native dan pengelolaan fokus bawaan browser.

## File utama

| File | Fungsi |
| --- | --- |
| `app/types/learning.ts` | Model konten, konfigurasi, attempt, sesi, preferensi |
| `app/data/content.ts` | Dataset draf, versi konten, alias, prerequisites, pasangan pembanding |
| `app/utils/learning.ts` | Penilaian, pemilihan pool, urutan soal, statistik, progres, rekor |
| `app/utils/storage.ts` | IndexedDB, preferensi, validasi JSON impor |
| `app/composables/useLearningStore.ts` | State aplikasi, init, persist, ekspor/impor/reset |
| `app/composables/usePractice.ts` | Siklus sesi, timer, fokus input, jeda/resume |
| `app/layouts/default.vue` | Shell aplikasi dan inisialisasi progres lokal |
| `app/pages/index.vue` | Beranda |
| `app/pages/materi/index.vue` dan `[id].vue` | Tabel dan kartu materi |
| `app/pages/latihan.vue` | Konfigurasi serta pembuatan sesi |
| `app/pages/arena.vue` | Arena |
| `app/pages/hasil/[id].vue` | Hasil sesi |
| `app/pages/progres.vue` | Statistik dan riwayat |
| `app/pages/pengaturan.vue` | Preferensi, backup, reset, informasi konten |
| `app/assets/css/main.css` | Gaya dan breakpoint responsif |
| `tests/learning.test.mjs` | 9 tes domain/data/storage validation |
| `tests/e2e/learning.spec.ts` | 6 tes alur browser |
| `playwright.config.ts` | Edge di Windows; server pengujian opsional |

README sudah diperbarui dengan struktur, penggunaan, penyimpanan, pengujian, dan batas implementasi.

## Konten dan batas rilis

Versi konten: `2026.11-draft.1`.

- Hiragana dan katakana: masing-masing 46 bentuk dasar, 25 dakuten/handakuten, 33 kombinasi kecil (104 item huruf/kombinasi per script).
- Lebih dari 60 kata Jepang dengan jawaban/alias eksplisit, termasuk contoh sokuon, n, kombinasi kecil, dan vokal panjang.
- Hangul: 14 konsonan dasar dan 10 vokal dasar; prompt latihan berupa blok (misalnya ㄱ diuji dengan 가 → ga), bukan satu bunyi konstan untuk jamo.
- Lebih dari 20 kata Korea tanpa batchim. Tes integritas memeriksa tidak adanya konsonan akhir pada dataset kata Korea.
- Sumber pada setiap item: Japan Foundation Irodori Starter dan National Institute of Korean Language. Kedua halaman sumber telah dibuka untuk referensi; ini **bukan** peninjauan kompetensi bahasa atau verifikasi setiap kata oleh manusia.
- UI menandai materi sebagai draf. Belum ada review bahasa, klaim konten siap rilis, atau pilot aksesibilitas/pengguna.
- Tema gelap, efek suara, audio, akun/sinkronisasi, review terjadwal, PWA/offline penuh belum diimplementasikan; sebagian merupakan P1/lanjutan PRD.

## Verifikasi yang sudah selesai

1. `npm.cmd test`: **9/9 lulus**. Meliputi integritas konten/ID/prerequisite, alias/normalisasi, akurasi dan median, jawaban dibantu, progres 10 attempt/2 sesi, inferensi pasangan ambigu, queue benchmark/review, rekor, dan validasi impor.
2. `npm.cmd run typecheck`: **exit 0**, setelah seluruh halaman utama dibuat. Output tersimpan di `typecheck.log`.
3. Playwright: **6 passed (2.5m)**. Bukti akhir di `e2e-verified.log`. Skenario:
   - Pengguna baru buka kartu, menyelesaikan 10 soal, hasil 100%, reload, progres tetap ada.
   - Salah, bantuan, lewati, dan jawaban kosong.
   - Sprint expired menggunakan clock Playwright; prompt terbuka tidak dihitung salah.
   - Jeda/reload menjaga attempt dan memberi label sesi dijeda.
   - Hangul memakai prompt 가 dan viewport ponsel tidak overflow horizontal.
   - Impor invalid ditolak; reset membutuhkan konfirmasi dan bisa dibatalkan.
4. `npm.cmd run build`: **berhasil**, log berakhir `Build complete in 2m 10s!` di `build-check.log`. Sudah dikonfirmasi ulang saat pengguna meminta jeda.

Tangkapan layar yang sudah dilihat agent:
- `test-results/desktop-home.png`: beranda desktop.
- `test-results/mobile-materials.png`: tabel Hangul di viewport 390 × 844.

Log dan `test-results` diabaikan Git. Tersimpan di disk saat handoff, tetapi bukan pengganti dokumentasi ini. Ada sisa artefak kegagalan uji awal: kesalahan CSS extra parenthesis telah diperbaiki; timeout awal tes 40 detik dinaikkan ke 90 detik untuk kompilasi dingin. Jangan menganggap artefak kegagalan lama sebagai status terkini; hasil terakhir adalah 6 lulus.

Audit npm sebelumnya melaporkan 13 temuan dependency transitif (7 low, 6 moderate, tidak ada high/critical). Tidak menjalankan `audit fix --force` karena usulannya mencakup downgrade Nuxt. Belum ada audit ulang sesudah implementasi fitur.

## Menjalankan dan pengujian di mesin ini

PowerShell memblokir `npm.ps1`; gunakan `npm.cmd`.

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

**Perubahan pengguna yang harus dipertahankan:** `nuxt.config.ts` sudah diformat ulang dengan double quote dan ditambahkan `devServer.port: 3333`. Jangan menimpa pengaturan ini.

Server pengembangan milik pengguna sudah berjalan di `http://[::1]:3333` selama pengerjaan. Agent tidak menghentikannya. Nuxt menolak menjalankan dev server kedua untuk checkout yang sama. Tes browser terakhir memakai server tersebut melalui:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://[::1]:3333'
npm.cmd run test:e2e -- --max-failures=1
Remove-Item Env:\PLAYWRIGHT_BASE_URL
```

Playwright default menggunakan `channel: 'msedge'` pada Windows karena Edge sudah terpasang. Pengujian terakhir dijalankan dengan izin eksekusi lebih luas untuk browser headless. Pada mesin lain, ikuti README. Jika tidak memakai server eksternal, konfigurasi Playwright membuat server port 3210 sendiri.

Tidak ada tool browser/preview user-facing yang tersedia pada sesi ini. Verifikasi dilakukan lewat Playwright lokal. Skill Sites telah dibaca sebagai panduan implementasi lokal; tidak ada Site dibuat atau dipublikasikan.

## Daftar tindak lanjut pada handoff pertama (lihat pembaruan di atas)

1. Cocokkan fitur satu per satu dengan acceptance criteria PRD, dokumentasikan gap, dan lakukan review konten dengan penelaah bahasa. Jangan beri label rilis lengkap sebelum itu.
2. Tambah tes browser untuk Time Attack hingga selesai, tab tersembunyi/resume dengan penggantian prompt, pasangan terkurasi dari hasil, serta ekspor → reset → impor valid yang benar-benar mengembalikan progres. Tes yang ada baru mencakup invalid import dan konfirmasi reset.
3. Uji storage unavailable/quota, reload pada feedback, rotasi/keyboard virtual, dan sesi sangat panjang. Build/tes domain saat ini sudah lulus; jangan ulang tanpa alasan atau perubahan baru.
4. Review kronologi attempt lintas sesi: `Attempt` belum memiliki timestamp individual. `itemProgress` menghitung recent attempts dari urutan sesi dan array attempt. Jika sesi lama dilanjutkan setelah sesi baru, urutan recent bisa tidak mencerminkan waktu jawaban sebenarnya. Pertimbangkan timestamp attempt dan kompatibilitas skema ekspor.
5. Review keterbacaan/kontras teks sekunder dan ukuran teks kecil pada desktop/ponsel. Screenshot sudah terlihat rapi dan tidak overflow, tetapi belum ada audit WCAG. CSS saat ini padat; bisa dirapikan tanpa mengubah desain jika diperlukan.
6. `ContentItem.letterName` sudah tersedia untuk konsonan Hangul, tetapi grid saat ini menampilkan glyph serta blok/bacaan; nama huruf dijelaskan pada catatan kartu. Pertimbangkan menampilkan nama secara eksplisit di tabel agar pembedaan nama jamo vs bunyi lebih jelas.
7. Jalur rekomendasi materi menampilkan beberapa kelompok awal dan semua kelompok tetap tersedia melalui filter. Bisa disempurnakan menjadi jalur seluruh kelompok dan rekomendasi kata dari huruf yang dipelajari.
8. Setelah perubahan berikutnya, jalankan tes yang relevan dan pemeriksaan akhir. Jika memakai server pengguna yang masih aktif, gunakan `PLAYWRIGHT_BASE_URL`; jangan menghentikan server tersebut.

Pada saat jeda pertama tidak ada perubahan fitur setelah permintaan jeda. Pengerjaan selanjutnya baru dilanjutkan setelah pengguna meminta "lanjutkan" dan tercatat pada bagian pembaruan di atas.
