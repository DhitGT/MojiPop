# Kiko — maskot KanaLearn

Karakter asli untuk UI belajar Jepang/Korea. Versi aktif kembali menggunakan PNG asli melalui `app/components/KikoMascot.vue`, sesuai permintaan revert sebelum SVG berlapis.

Asset Kiko: `public/images/kiko-mascot.png`. Dibuat dengan built-in `image_gen`, background transparan, tanpa CLI/API fallback. File asli tidak diubah. Dipakai pada beranda dan sidebar desktop.

## Mimi

Maskot kedua berdasarkan foto kucing pengguna: bulu putih-oranye, pipi tembam, mata bulat gelap, hidung merah muda, ekor belang, dan ekspresi polos. Ilustrasi PNG transparan dibuat dengan built-in `image_gen`, memakai foto sebagai referensi identitas dan Kiko sebagai referensi gaya. Asset: `public/images/mimi-mascot.png`.

`app/components/MimiMascot.vue` memakai renderer PNG dan animasi yang sama melalui varian `character="mimi"` pada `KikoMascot.vue`, termasuk reduced motion, pause tab/offscreen, serta label tombol `Sapa Mimi`. Mimi tampil bersama Kiko di sidebar desktop dan pada hasil latihan di desktop/ponsel.

## Animasi di aplikasi

CSS menggerakkan gambar utuh: idle, reaksi hover, lompatan saat klik/Enter/Space, dan kilau. Prop `celebrate` memicu perayaan pada hasil sesi selesai. Varian dekoratif tidak menjadi tombol. Tidak ada rig per bagian tubuh pada versi yang dipulihkan ini.

Animasi dihentikan ketika preferensi aplikasi/sistem mengurangi gerakan, tab tersembunyi, atau maskot keluar viewport. Listener dan IntersectionObserver dibersihkan saat komponen dilepas. Transform pada wrapper animasi dipisahkan dari rotasi/ukuran tema agar tata letak tetap stabil.

Versi SVG berlapis dan perpindahan ke GSAP dibatalkan atas permintaan pengguna. GSAP dihapus dari package.json dan lockfile; tidak ada library animasi tambahan yang digunakan.

Catatan QA rig SVG pada log lama merupakan arsip, bukan status implementasi aktif.

## Empat kepribadian

Profil terpusat ada di `app/data/mascots.ts`. Semua karakter bisa dipilih acak dengan peluang sama di Typing Race dan tampil di sidebar. Arena latihan bergantian memakai keempat karakter dan komentar dari profilnya.

| Karakter | Sifat | Respons salah | Fokus / kewalahan (ketikan per 2 detik) | Mengantuk |
| --- | --- | --- | --- | --- |
| Kiko | Kompetitif, gampang sewot | Menggerutu, simbol marah, kepala bergoyang | 12 / 22 | 5 detik |
| Mimi | Santai, suportif | Menenangkan dan menyemangati | 16 / 30 | 7 detik |
| Kuro | Sinis, perfeksionis | Tatapan menyamping dan sindiran ringan | 14 / 26 | 9 detik |
| Momo | Cuek, gampang bengong | Tatapan datar dan komentar pendek | 20 / 36 | 3,5 detik |

Gerakan idle, tempo telapak, komentar tiap kondisi, dan jumlah ketikan benar untuk tertawa berbeda per karakter. Kuro berdasarkan foto kucing hitam pengguna, Momo berdasarkan foto kucing putih bertopi hitam. Aset transparan dibuat melalui built-in `image_gen`, disimpan sebagai `public/images/kuro-mascot.png` dan `public/images/momo-mascot.png`. Prompt produksi dicatat di `app/docs/mascot-prompts.md`.

## Teman mengetik di Typing Race

`TypingRaceMascot.vue` memakai potongan kepala PNG dari salah satu empat karakter, dipilih acak setiap sesi baru/ulang, dengan keyboard dan dua telapak dekoratif dari SVG. Warna telapak, muka, dan kelopak mengikuti masing-masing karakter. Aset PNG dan renderer maskot umum tetap digunakan seperti sebelumnya. Keyboard menghadap maskot; tangan dan tombol merespons karakter, spasi, dan backspace, termasuk input keyboard ponsel. Teks ketikan melayang di ruang khusus di atas kepala, dibatasi delapan karakter sekaligus dan dibersihkan setelah 850 ms.

Kepala bergerak saat mengetik dan berkedip berkala. Batas ekspresi mengikuti profil di atas. Saat kewalahan, mata berubah spiral, mulut terbuka, muncul keringat, kepala bergoyang, dan tangan lebih cepat. Ekspresi ini menghilang setelah 1,2 detik tanpa ketikan, dan turun sesuai ritme ketika mengetik lagi. Tertawa muncul setelah 20/24/24/32 ketikan benar beruntun masing-masing untuk Kiko/Mimi/Kuro/Momo pada kecepatan santai. Gerakan tangan berhenti setelah 180 ms tanpa ketikan. Gerakan dan partikel dihentikan saat tab disembunyikan atau pengaturan aplikasi/sistem mengurangi gerakan. Timer dan listener dibersihkan ketika komponen dilepas.

## Prompt PNG referensi awal

Use case: illustration-story. Asset type: transparent PNG mascot for KanaLearn, a colorful Japanese/Korean alphabet learning web app. Create ONE original cheerful turquoise cat creature named Kiko (no lettering). Full body, large chunky rounded head, oversized expressive navy eyes, warm cream muzzle and belly, pointy ears with vivid coral insides, tiny yellow star on its forehead, short rounded feet and curled tail. One paw waving enthusiastically; other paw holds a small purple book with a plain yellow cover badge. Friendly confident smile. Bold polished 2D game sticker illustration with thick dark navy outlines, simple flat vibrant color areas and subtle cel shading, readable even at 80px; playful educational game personality. Isolated on genuinely transparent background, no background scene, no ground rectangle, no text, no watermark, no logos, no additional characters. Square composition, entire ears/tail/paws fully visible, character fills about 85% of canvas. Distinct original character, not an owl or any existing app mascot.
