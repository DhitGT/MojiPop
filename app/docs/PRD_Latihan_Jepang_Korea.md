# PRD Website Latihan Membaca Jepang dan Korea

Versi 1.0 • 13 November 2026 • Status rancangan produk untuk implementasi

## 1 Ringkasan produk

Website publik berbahasa Indonesia untuk membantu pemula mengenali huruf Jepang dan Korea, mengingat bacaannya, lalu membaca kata pendek tanpa bantuan Latin. Pengguna menjawab dengan mengetik romanisasi menggunakan keyboard biasa. Versi pertama mengutamakan materi Jepang, menyediakan Korea dasar, dan menyimpan progres di browser tanpa akun.

Pengalaman utama adalah mengenal kelompok kecil huruf, mencoba mengingat tanpa melihat jawaban, berlatih dalam game, melihat kesalahan, lalu mengulang materi yang belum dikuasai. Tampilan playful dengan warna, animasi ringan, dan pencapaian.

Istilah “alphabet” digunakan untuk komunikasi umum. Di dalam materi, gunakan istilah yang tepat: hiragana dan katakana untuk Jepang serta Hangul untuk Korea.

## 2 Tujuan dan batas keberhasilan

Tujuan pengguna:
- Melihat huruf dan langsung mengingat bacaannya.
- Membaca kata pendek tanpa petunjuk romanisasi.
- Mengetahui huruf yang sering salah dan pasangan yang tertukar.
- Mengukur perkembangan akurasi dan kecepatan pada materi yang sebanding.

Produk mengukur kemampuan mengenali dan menuliskan bacaan, bukan kemampuan berbicara atau keseluruhan penguasaan bahasa. Hasil typing juga dipengaruhi kemampuan mengetik.

Hipotesis produk: sesi singkat, materi bertahap, dan latihan ulang terarah membuat pengguna lebih mudah konsisten. Hipotesis ini perlu diuji; jumlah pengulangan dan ambang kelancaran di dokumen ini adalah keputusan awal yang dapat dikalibrasi.

## 3 Pengguna dan prinsip pengalaman

Target: publik, terutama penutur Indonesia yang baru mulai atau sudah mengenal sebagian kana/Hangul.

Pengguna dapat langsung belajar tanpa registrasi. Semua materi terbuka; jalur rekomendasi menunjukkan urutan belajar, tanpa mengunci akses. Pengguna dapat berlatih 3–10 menit, memilih kelompok sendiri, dan berhenti kapan saja.

Prinsip:
1. Akurasi mendahului kecepatan.
2. Jawaban tidak terlihat sebelum pengguna mencoba.
3. Latihan selalu menawarkan langkah lanjutan yang konkret.
4. Bantuan dipisahkan dari hasil mandiri.
5. Warna dan animasi membantu fokus tanpa mengganggu pembacaan.

## 4 Cakupan materi rilis pertama

| Area | Cakupan |
| --- | --- |
| Hiragana | 46 bentuk dasar; dakuten, handakuten, kombinasi kecil seperti きゃ; pengantar っ, ん dan vokal panjang |
| Katakana | 46 bentuk dasar; dakuten, handakuten, kombinasi kecil; pengantar ッ dan tanda panjang ー |
| Kata Jepang | Target minimum 60 kata terkurasi, bertahap dari 2–5 kana; dipilih sesuai materi yang sedang dilatih |
| Hangul | 14 konsonan dasar, 10 vokal dasar, pengenalan susunan blok dan peran awal/akhir huruf |
| Bacaan Korea | Blok konsonan-vokal sederhana dan target minimum 20 kata terkurasi dengan pola yang telah diajarkan |
| Huruf mirip | Kelompok pembanding terkurasi, misalnya ぬ/め, れ/ね, シ/ツ, ソ/ン dan ㅏ/ㅓ |

Kata Korea dengan batchim kompleks atau perubahan bunyi yang belum diajarkan ditunda. Huruf yang memiliki bunyi berbeda menurut posisi dijelaskan secara kontekstual, bukan dipaksakan memiliki satu bacaan tetap.

Kanji, tata bahasa, percakapan, evaluasi pelafalan, pengenalan tulisan tangan, dan keyboard Jepang/Korea tidak masuk rilis pertama.

## 5 Alur utama

Beranda → pilih bahasa → pilih jalur rekomendasi atau materi bebas → pelajari kartu → tentukan mode latihan → jawab → lihat hasil → ulang kesalahan atau latihan pasangan tertukar.

Pengguna yang sudah mengenal materi boleh langsung masuk latihan. Pilihan bahasa dan pengaturan terakhir diingat.

Contoh: pengguna memilih hiragana kelompok N, berlatih 20 soal, kemudian melihat bahwa ぬ sering dijawab me. Tombol “Latih ぬ dan め” membuka latihan terarah dengan penjelasan perbedaan bentuk sebelum soal dimulai.

## 6 Fitur dan prioritas

| ID | Prioritas | Kebutuhan |
| --- | --- | --- |
| F01 | P0 | Pemilihan Jepang/Korea dan jalur rekomendasi yang tidak mengunci materi |
| F02 | P0 | Tabel huruf dengan filter kelompok dan detail bacaan |
| F03 | P0 | Kartu pengenalan dan pembeda bentuk huruf mirip |
| F04 | P0 | Latihan ketik huruf dan kata dalam tiga mode |
| F05 | P0 | Pemeriksaan romanisasi berbasis jawaban valid per soal |
| F06 | P0 | Umpan balik salah dengan jawaban benar dan penjelasan singkat |
| F07 | P0 | Hasil sesi, riwayat lokal, dan statistik per item |
| F08 | P0 | Ulang kesalahan sesi dan latihan pasangan tertukar |
| F09 | P0 | Penyimpanan lokal, ekspor/impor progres, dan reset terkonfirmasi |
| F10 | P0 | Antarmuka responsif, kontrol keyboard, dan pengurangan animasi |
| F11 | P1 | Pencapaian lokal dan ringkasan perkembangan antarsesi |
| F12 | P1 | Tema gelap dan suara efek opsional |
| F13 | Lanjutan | Audio bacaan, akun/sinkronisasi, review terjadwal dan materi Korea lanjutan |

P0 wajib untuk rilis yang memenuhi kebutuhan utama; P1 dapat menyusul tanpa mengubah alur belajar.

## 7 Tabel huruf dan kartu pengenalan

Tabel menampilkan glyph, romanisasi utama, kelompok, dan status latihan. Romanisasi bisa disembunyikan untuk menguji ingatan.

Detail kartu berisi:
- Bentuk besar yang jelas dan bacaan utama.
- Variasi jawaban Latin yang diterima, jika ada.
- Catatan bentuk dan pembanding huruf mirip.
- Contoh kata beserta bacaan dan arti singkat.
- Tombol “Latih huruf ini”.

Jalur rekomendasi membagi materi menjadi kelompok sekitar 5 item; ukuran dapat berubah sesuai struktur bahasa. Setelah kartu, pengguna mendapat latihan huruf acak, kemudian kata yang tersusun dari materi terkait. Tidak ada syarat lulus untuk membuka materi lain.

Petunjuk hafalan bersifat bantuan visual; jangan menyajikan cerita hafalan sebagai asal-usul faktual huruf.

## 8 Aturan input dan umpan balik

Prompt contoh: き → ki, ねこ → neko, 가 → ga. Arti kata dan bacaan disembunyikan sampai dijawab.

Enter atau tombol Jawab mengirim satu jawaban. Tidak ada pengiriman otomatis saat input menjadi cocok, agar jawaban dengan panjang berbeda dan alias tidak menimbulkan ketidakadilan. Spasi tepi dibuang dan huruf besar dinormalisasi. Input kosong tidak dikirim; Lewati menjadi aksi terpisah.

Jawaban benar memberikan indikator singkat dan lanjut otomatis setelah transisi pendek. Jawaban salah menampilkan input pengguna, bacaan benar, dan penjelasan terkurasi bila tersedia. Pengguna menekan Lanjut; tidak diwajibkan mengetik ulang. Pada Sprint, waktu tetap berjalan saat umpan balik, dan hal ini dijelaskan sebelum mulai.

Saat pengguna membuka petunjuk, soal diberi label dibantu dan tidak dihitung sebagai benar mandiri. Backspace sebelum kirim diperbolehkan; satu kiriman adalah hasil akhir soal. Lewati dihitung terpisah dan mengurangi akurasi.

## 9 Tiga mode latihan

| Mode | Aturan | Hasil utama |
| --- | --- | --- |
| Santai | Pilih 10, 20, 30 soal atau sesi bebas; tidak ada batas waktu | Akurasi, waktu respons dan kesalahan |
| Time Attack | Selesaikan 10, 20 atau 30 soal secepat mungkin | Durasi total dan akurasi |
| Sprint 60 detik | Jawab sebanyak mungkin dalam 60 detik aktif | Benar mandiri, salah, lewati dan akurasi |

Setiap mode dapat menggunakan huruf atau kata; pilihan ini terpisah agar hasil tetap bisa dibandingkan. Bahasa, sistem tulisan, kelompok, jumlah soal dan sumber materi dapat diatur sebelum mulai.

Pada Sprint, soal yang masih terbuka saat waktu habis berstatus tidak selesai, bukan salah. Hasil utama hanya jawaban yang sudah dikirim sebelum tenggat. Timer memakai elapsed time yang stabil, bukan jumlah interval yang berhasil berjalan.

Saat tab tersembunyi atau pengguna pause, soal ditutup dan sesi dijeda. Melanjutkan menampilkan soal pengganti agar waktu berpikir tersembunyi tidak tercatat sebagai respons cepat. Sesi yang dijeda tetap tersimpan tetapi tidak menjadi rekor kecepatan.

## 10 Penilaian dan pembandingan

Akurasi mandiri = jumlah benar tanpa bantuan / seluruh soal terselesaikan × 100%. Soal terselesaikan mencakup benar, salah, dibantu dan dilewati. Jawaban dibantu tidak dihitung salah secara linguistik, tetapi bukan keberhasilan mandiri.

Waktu respons dihitung dari prompt siap terlihat sampai jawaban dikirim. Durasi umpan balik tidak termasuk waktu respons, tetapi termasuk durasi aktif sesi. Median respons benar mandiri menjadi metrik kecepatan utama; jika tidak ada jawaban benar mandiri, tampilkan “Belum cukup data”.

Sprint mengutamakan jumlah benar, dengan akurasi selalu terlihat. Time Attack menampilkan waktu dan akurasi berdampingan. Label rekor kecepatan membutuhkan akurasi minimal 90% dan sesi tanpa jeda; ini ambang produk awal, bukan bukti kemampuan bahasa.

Rekor dibandingkan hanya dalam konfigurasi sama: bahasa, script, mode, huruf/kata, kelompok, jumlah soal, versi konten dan kelas perangkat/input. Paket acak diberi label variasi soal; benchmark tetap memakai komposisi paket yang stabil dengan urutan diacak.

WPM tidak menjadi metrik utama karena panjang romanisasi berbeda. Kata/soal benar per menit boleh ditampilkan sebagai statistik tambahan, dengan jenis materi tetap jelas.

## 11 Rangkuman kesalahan dan latihan ulang

Halaman hasil memuat:
- Benar, salah, dibantu, lewati dan tidak selesai.
- Akurasi mandiri, durasi aktif, median respons benar.
- Daftar item, jawaban pengguna, jawaban benar dan waktu respons.
- Item paling sering salah dengan hitungan, misalnya “ぬ: salah 3 dari 5”.
- Pasangan yang kemungkinan tertukar berdasarkan input.
- Tombol Ulang Kesalahan, Latih Pasangan, Ulang Paket dan Pilih Materi.

Ulang Kesalahan memakai item salah atau dilewati dari sesi terkait. Rekomendasi awal: sekitar 70% soal berasal dari item itu dan 30% dari materi benar dalam kelompok sama agar tetap berlatih membedakan. Rasio menyesuaikan pool yang tersedia. Item salah dimunculkan lagi setelah beberapa soal lain, bukan langsung berkali-kali. Jika pool sangat kecil, aplikasi memberitahukan bahwa item akan berulang.

Latihan pasangan hanya dibuat dari pemetaan yang valid dan pembanding terkurasi. Contoh: prompt ぬ, input me, kemungkinan tertukar dengan め. Bila input tidak memetakan secara unik ke satu item, jangan menuduh pasangan tertentu. Kelompok dengan romanisasi sama tidak dinilai sebagai kebingungan visual hanya berdasarkan jawaban ketik.

Untuk kata, salah dicatat pada kata utuh. Aplikasi tidak otomatis menganggap semua huruf di dalamnya belum dikuasai. Pengguna dapat membuka rincian bacaan dan memilih latihan huruf penyusunnya.

Jika tidak ada kesalahan, tombol ulang kesalahan diganti pesan positif dan rekomendasi materi berikutnya.

## 12 Status belajar dan rekomendasi

Setiap item memiliki status Belum Dilatih, Sedang Dilatih, Perlu Diulang, atau Lancar Sementara.

Aturan awal:
- Belum Dilatih jika belum ada attempt mandiri.
- Perlu Diulang jika salah atau dilewati pada tiga attempt terakhir.
- Lancar Sementara jika setidaknya 10 attempt mandiri pada dua sesi, dengan minimal 9 dari 10 benar.
- Selain itu Sedang Dilatih.

Status ini bukan klaim ingatan jangka panjang. Kecepatan ditampilkan terpisah agar orang yang mengetiknya lambat tidak dianggap belum mengenal huruf. Kartu yang hanya dibuka tidak menaikkan status.

Beranda merekomendasikan urutan: lanjut sesi terakhir, ulang kesalahan, lalu kelompok berikutnya. Tidak ada review harian otomatis pada rilis pertama.

## 13 Halaman dan desain

| Halaman | Isi utama |
| --- | --- |
| Beranda | Pilih bahasa, lanjut latihan, progres ringkas dan rekomendasi |
| Materi | Jalur belajar dan tabel yang dapat difilter |
| Detail materi | Kartu huruf, bacaan dan pembeda visual |
| Pengaturan latihan | Mode, kelompok, huruf/kata dan jumlah soal |
| Arena | Prompt besar, input terfokus, progres dan timer sesuai mode |
| Hasil | Metrik, kesalahan dan aksi latihan ulang |
| Progres | Riwayat sesi dan statistik per item |
| Pengaturan | Animasi, tema, ekspor/impor, reset dan penjelasan penyimpanan |

Visual memakai warna cerah yang konsisten, kartu membulat dan animasi singkat. Arena tetap tenang, dengan karakter sebagai elemen paling dominan. Bentuk kana/Hangul memakai font terbaca; dekorasi tidak mengubah bentuk huruf.

Pencapaian contoh: sesi pertama selesai, 20 jawaban benar berturut-turut, dan seluruh kelompok pernah dilatih. Syarat harus terlihat. Keberhasilan menjawab ulang kesalahan juga dirayakan, tanpa menyatakan item pasti diingat selamanya.

Seluruh alur utama bisa dipakai dengan keyboard maupun sentuhan. Benar/salah ditandai ikon dan teks, bukan warna saja. Dukungan reduced motion tersedia; fokus input tidak berpindah akibat animasi. Mode santai selalu tersedia bagi pengguna yang tidak nyaman dengan timer.

## 14 Aturan bahasa dan kualitas konten

Jepang menggunakan satu tampilan romanisasi utama yang konsisten dan daftar alias per item. Contoh keputusan produk: し menampilkan shi dan dapat menerima si; ち menampilkan chi dan dapat menerima ti. Daftar alias bukan aturan penggantian global.

Huruf dengan romanisasi sama seperti じ dan ぢ tidak dapat dibedakan lewat jawaban ji. Jelaskan batas ini dalam materi. Partikel dan kata berbacaan khusus tidak dimasukkan tanpa konteks. Kata dengan っ, ん, kombinasi kecil atau vokal panjang memiliki daftar jawaban valid yang ditinjau secara eksplisit.

Korea menggunakan Revised Romanization sebagai acuan tampilan. Karena bacaan konsonan dapat dipengaruhi posisi, soal harus menyatakan konteks. Untuk pengenalan bunyi konsonan awal, gunakan blok seperti 가 atau 나; jangan meminta satu jawaban konstan untuk ㄱ tanpa petunjuk konteks. Tabel membedakan nama huruf dari bunyi dalam blok.

Setiap item menyimpan sumber, canonical answer, aliases, penjelasan, prerequisite dan versi. Semua kata serta alias ditinjau oleh penelaah yang kompeten sebelum rilis. Materi referensi bukan izin menyalin ilustrasi atau audio.

## 15 Data dan penyimpanan

Entitas minimum:
- ContentItem: id, bahasa, script, jenis, glyph/kata, kelompok, bacaan utama, jawaban valid, arti, pembeda, prerequisite, sumber dan versi.
- ConfusionGroup: item terkait, penjelasan visual dan aturan pemetaan jawaban.
- Session: id, konfigurasi, versi paket, waktu mulai/selesai, durasi aktif, status dan flag jeda.
- Attempt: id, sessionId, itemId, input, hasil, waktu respons, bantuan dan urutan.
- ItemProgress: agregat attempt, status dan riwayat singkat per item.
- Settings/Achievement: preferensi dan pencapaian lokal.

IndexedDB menjadi pilihan awal penyimpanan riwayat; pengaturan kecil dapat disimpan di localStorage. Data ditulis tiap attempt yang selesai. Agregat dapat dibangun ulang dari attempt, sehingga reload tidak menggandakan hasil.

Sesi terputus disimpan sebagai belum selesai dan tidak masuk rekor. Jika storage gagal/penuh, tampilkan peringatan jelas dan sediakan ekspor sejauh data masih terbaca.

Tampilkan penjelasan sejak awal: progres hanya ada di browser/perangkat ini, tidak tersinkron, dan bisa hilang jika data browser dihapus. Ekspor/impor JSON disertai versi skema dan validasi. Impor versi pertama mengganti progres setelah konfirmasi, bukan menggabungkan otomatis. Reset juga membutuhkan konfirmasi.

Tidak ada akun, leaderboard global atau pengumpulan jawaban ke server pada MVP.

## 16 Persyaratan nonfungsional

- Responsif pada ponsel dan desktop, termasuk keyboard virtual yang mengurangi tinggi viewport.
- Arena tidak membutuhkan request jaringan per jawaban setelah konten berhasil dimuat.
- Target internal: feedback jawaban tampil dalam 100 ms pada perangkat uji yang disepakati, di luar durasi animasi.
- Timer dan penyimpanan diuji terhadap reload, tab tersembunyi dan pergantian orientasi.
- Prompt berikutnya tampil setelah font dan konten siap agar waktu respons adil.
- DOM/input dan data impor diperlakukan sebagai data, tidak dieksekusi sebagai HTML.
- Identitas item stabil; perubahan jawaban atau konten berversi tidak mencampurkan rekor yang sudah tidak sebanding.
- Mode offline penuh/PWA merupakan peningkatan lanjutan; penyimpanan lokal tidak otomatis berarti aplikasi dapat dibuka tanpa internet.

## 17 Metrik dan validasi produk

Metrik lokal untuk pengguna: akurasi per kelompok, median respons benar, item sering salah, pasangan tertukar dan perkembangan antar paket sebanding.

Metrik evaluasi pilot yang diusulkan: pengguna menyelesaikan sesi pertama, memakai ulang kesalahan, dan menunjukkan perbaikan akurasi pada sesi berikutnya. Karena MVP tidak memiliki analitik terpusat, angka ini diuji melalui sesi usability dengan peserta yang setuju atau ekspor anonim sukarela. Jangan menampilkan klaim retensi publik yang belum diukur.

Uji pilot sebaiknya mencakup pemula total, pengguna yang sudah mengenal sebagian kana, serta ponsel dan desktop. Periksa apakah pengguna memahami romanisasi, bisa memulai tanpa panduan, dan mengerti alasan sebuah jawaban salah.

## 18 Kriteria penerimaan rilis

1. Pengunjung baru dapat memilih bahasa, membaca kartu dan menuntaskan latihan tanpa akun.
2. Semua materi terbuka, walaupun belum pernah menyelesaikan kelompok sebelumnya.
3. Tiga mode berjalan dengan batas waktu/jumlah soal yang benar.
4. Input valid dan semua alias yang disetujui diterima; input lain ditolak secara konsisten.
5. Kesalahan menampilkan jawaban benar dan penjelasan yang tersedia.
6. Rangkuman sesuai attempt, termasuk bantuan, lewati dan soal Sprint yang tidak selesai.
7. Ulang Kesalahan berasal dari sesi yang dipilih dan tidak membuka paket kosong.
8. Latihan pasangan tidak menghasilkan kesimpulan dari jawaban ambigu.
9. Progres bertahan setelah reload; attempt tersimpan tidak terhitung dua kali.
10. Sesi dijeda/terputus tidak menggantikan rekor kecepatan.
11. Ekspor, impor tervalidasi dan reset terkonfirmasi berfungsi.
12. Semua alur inti dapat digunakan dengan keyboard dan ponsel; glyph tidak terpotong.
13. Seluruh materi rilis dan aturan jawaban lolos pemeriksaan konten.

## 19 Tahapan implementasi

Tahap 1: definisi konten dan alias, tabel huruf, kartu serta latihan santai Jepang.
Tahap 2: Time Attack/Sprint, pencatatan attempt dan hasil sesi.
Tahap 3: latihan kesalahan, pasangan tertukar, progres, ekspor/impor.
Tahap 4: Korea dasar, pencapaian, pemeriksaan aksesibilitas dan pilot.

Durasi baru ditentukan setelah desain dan kapasitas tim diketahui. Tidak perlu backend atau layanan AI untuk memeriksa jawaban pada MVP; konten dan jawaban dapat berupa dataset berversi.

Stack belum merupakan keputusan pengguna. Implementasi dapat memakai framework frontend yang tim kuasai; aturan soal, penilaian dan progres sebaiknya dipisah dari komponen UI.

## 20 Risiko dan keputusan awal

| Risiko | Keputusan |
| --- | --- |
| Mengejar kecepatan lewat tebakan | Akurasi terlihat dan rekor memiliki ambang akurasi |
| Hafal romanisasi tetapi belum bisa melafalkan | Jelaskan batas produk; audio masuk pengembangan lanjutan |
| Progres lokal hilang | Informasi jelas serta ekspor/impor sejak MVP |
| Jawaban benar ditolak akibat variasi romanisasi | Alias per item dan review konten |
| Kata salah dianggap semua hurufnya salah | Statistik kata terpisah dari huruf |
| Ulang paket terasa hafalan urutan | Urutan diacak dan materi diinterleaving |
| Jepang terlalu luas untuk rilis | Prioritas konten dasar; kombinasi/pola lanjut ditambahkan bertahap sebelum label cakupan lengkap |
| Pencapaian mendorong repetisi tanpa belajar | Status hanya naik dari attempt mandiri, dengan label sementara |

Keputusan yang sudah dikonfirmasi: publik, Jepang lebih lengkap/Korea dasar, jawaban ketik Latin untuk huruf dan kata, semua materi terbuka dengan rekomendasi, tiga mode, jawaban salah langsung dijelaskan, ulang kesalahan dan pasangan tertukar, tanpa akun, serta visual playful.

Default usulan yang masih dapat diubah: nama produk belum ditetapkan, UI Indonesia, mobile dan desktop, jumlah soal 10/20/30, pool konten minimum, ambang rekor 90%, dan aturan progres.

## 21 Referensi konten

- Japan Foundation, Irodori Starter: https://www.irodori.jpf.go.jp/en/starter/pdf.html
- National Institute of Korean Language, Romanization of Korean: https://www.korean.go.kr/front_eng/roman/roman_01.do

Referensi mendukung peninjauan materi dan aturan bacaan; fitur game, skor, ambang dan alur belajar merupakan rancangan produk dalam PRD ini.

