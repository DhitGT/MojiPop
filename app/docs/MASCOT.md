# Kiko — maskot KanaLearn

Karakter asli untuk UI belajar Jepang/Korea. Versi aktif kembali menggunakan PNG asli melalui `app/components/KikoMascot.vue`, sesuai permintaan revert sebelum SVG berlapis.

Asset aktif: `public/images/kiko-mascot.png`. Dibuat dengan built-in `image_gen`, background transparan, tanpa CLI/API fallback. File asli tidak diubah. Dipakai pada beranda, sidebar desktop dan hasil sesi.

## Animasi di aplikasi

CSS menggerakkan gambar utuh: idle, reaksi hover, lompatan saat klik/Enter/Space, dan kilau. Prop `celebrate` memicu perayaan pada hasil sesi selesai. Varian dekoratif tidak menjadi tombol. Tidak ada rig per bagian tubuh pada versi yang dipulihkan ini.

Animasi dihentikan ketika preferensi aplikasi/sistem mengurangi gerakan, tab tersembunyi, atau maskot keluar viewport. Listener dan IntersectionObserver dibersihkan saat komponen dilepas. Transform pada wrapper animasi dipisahkan dari rotasi/ukuran tema agar tata letak tetap stabil.

Versi SVG berlapis dan perpindahan ke GSAP dibatalkan atas permintaan pengguna. GSAP dihapus dari package.json dan lockfile; tidak ada library animasi tambahan yang digunakan.

Catatan QA rig SVG pada log lama merupakan arsip, bukan status implementasi aktif.

## Prompt PNG referensi awal

Use case: illustration-story. Asset type: transparent PNG mascot for KanaLearn, a colorful Japanese/Korean alphabet learning web app. Create ONE original cheerful turquoise cat creature named Kiko (no lettering). Full body, large chunky rounded head, oversized expressive navy eyes, warm cream muzzle and belly, pointy ears with vivid coral insides, tiny yellow star on its forehead, short rounded feet and curled tail. One paw waving enthusiastically; other paw holds a small purple book with a plain yellow cover badge. Friendly confident smile. Bold polished 2D game sticker illustration with thick dark navy outlines, simple flat vibrant color areas and subtle cel shading, readable even at 80px; playful educational game personality. Isolated on genuinely transparent background, no background scene, no ground rectangle, no text, no watermark, no logos, no additional characters. Square composition, entire ears/tail/paws fully visible, character fills about 85% of canvas. Distinct original character, not an owl or any existing app mascot.
