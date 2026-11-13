# Status penerimaan MVP KanaLearn

Pemetaan implementasi ke bagian 18 PRD. Catatan ini membedakan pengujian teknis dari peninjauan konten dan pilot pengguna; belum merupakan persetujuan rilis publik.

## Implementasi dan bukti

| Kriteria PRD | Implementasi / bukti yang tersedia | Batas verifikasi |
| --- | --- | --- |
| 1. Pilih bahasa, kartu, latihan tanpa akun | E2E pengguna baru: kartu hiragana → 10 soal → hasil → reload. Hangul memakai prompt blok. | Belum pilot dengan pemula sebenarnya. |
| 2. Semua materi terbuka | Filter bebas dan seluruh jalur; pengenalan dibagi maksimal 5 item. Tes domain memastikan seluruh huruf tercakup; E2E menguji navigasi kelompok dan kata terkait. | Tidak ada penguncian berdasarkan skor. |
| 3. Tiga mode berjalan | Santai 10 soal, Time Attack 10 soal sampai rekor, Sprint dengan clock terkendali; pause/tab tersembunyi menghentikan waktu aktif dan mengganti prompt. | Perlu uji perangkat fisik dan browser lain. |
| 4. Input/alias konsisten | Tes domain memeriksa canonical dan seluruh alias yang tercantum, case/spasi tepi, alias per item, dan konteks konsonan Hangul. | Persetujuan linguistik alias belum dilakukan. |
| 5. Kesalahan diberi jawaban dan penjelasan | Feedback arena menampilkan input, bacaan, catatan, dan Lanjut. E2E jawaban salah dan pasangan pembanding. | Catatan konten masih draf. |
| 6. Rangkuman sesuai attempt | Tes domain akurasi, median, assisted, skip; E2E angka hasil dan prompt Sprint tidak selesai. | Waktu respons juga dipengaruhi kemampuan mengetik. |
| 7. Ulang kesalahan dari sesi terkait | Review ID diambil dari salah/lewati sesi asal; pembanding dari jawaban benar kelompok sama. E2E memastikan paket dapat dimulai; tes domain menguji rasio dan pengulangan pool kecil. | Rasio menyesuaikan jika pool kecil untuk menghindari pengulangan langsung. |
| 8. Pasangan tidak disimpulkan dari jawaban ambigu | Pemetaan unik dalam script yang sama + pasangan terkurasi. Tes domain menolak alias ambigu, assisted, kata, dan pasangan tak terkurasi. E2E ぬ dijawab me → latihan ぬ/め. | Saran adalah kemungkinan tertukar, bukan diagnosis pasti. |
| 9. Persisten dan tidak ganda setelah reload | IndexedDB per sesi, attempt ber-ID stabil. E2E reload hasil, pause/reload, ekspor/reset/impor, dan reload saat feedback. Timestamp per jawaban memperbaiki urutan saat sesi lama dilanjutkan. | Cadangan lama tanpa timestamp menggunakan urutan sesi/attempt yang tersedia. |
| 10. Sesi dijeda/terputus tidak jadi rekor | Tes domain flag jeda, target belum selesai, versi konten dan input berbeda; E2E jeda dan Sprint tab tersembunyi. | Kecepatan hanya dibandingkan pada konfigurasi yang sama. |
| 11. Backup dan reset terkonfirmasi | E2E ekspor → reset → impor valid → reload, invalid JSON/schema ditolak, dialog bisa dibatalkan. Quota storage disimulasikan; data memori masih bisa diekspor. | Belum menguji seluruh implementasi/private mode IndexedDB browser lain. |
| 12. Keyboard, ponsel, glyph utuh | Enter/Esc, label input, native dialog, navigasi keyboard, reduced motion, viewport 390 px, rotasi dan tinggi viewport pendek. Warna teks sekunder diperjelas. | Emulasi ukuran viewport tidak menggantikan pengujian keyboard virtual nyata atau audit aksesibilitas lengkap. |
| 13. Konten lolos pemeriksaan | Tes otomatis memeriksa ID unik, prerequisite, jumlah konten, alias yang tercantum, dan kata Korea tanpa batchim. Referensi pada setiap item. | **Belum terpenuhi untuk rilis: seluruh kata/alias perlu penelaah bahasa kompeten.** |

## Perubahan lanjutan setelah handoff pertama

- Jawaban baru memiliki `answeredAt`; status belajar dan rangkaian benar mengikuti waktu jawaban lintas sesi. Skema cadangan tetap versi 1 dan timestamp opsional agar cadangan lama tetap dapat dibaca.
- Pool item terarah tidak lagi diwariskan diam-diam saat membuka pengaturan latihan baru.
- Jalur huruf/kombinasi mencakup semua materi dalam langkah maksimal lima item; kata terkait memakai prerequisite dari langkah itu dan langkah sebelumnya.
- Nama jamo dan bacaan blok Hangul ditampilkan terpisah. Filter kartu mencantumkan kelompok dan bisa mencari nama jamo.
- Review dengan pool sangat kecil menyesuaikan rasio agar tidak mengulang item langsung jika ada alternatif.
- Ukuran/warna teks sekunder, status, label dan arena diperjelas tanpa mengganti arah visual.

## Hal yang masih memerlukan pekerjaan sebelum rilis

1. Peninjauan kata, canonical answer, alias dan penjelasan oleh penelaah bahasa; dokumentasikan persetujuannya, baru ubah label konten draf.
2. Pilot pengguna pemula dan audit aksesibilitas pada perangkat fisik, keyboard virtual, pembaca layar, serta browser lain.
3. Ukur target feedback <100 ms pada perangkat yang disepakati; tes fungsional saat ini belum membuktikan target performa itu.
4. Evaluasi dependency audit yang sebelumnya melaporkan 13 temuan low/moderate. Hindari `audit fix --force` tanpa memeriksa perubahan versi.

Tema gelap dan efek suara P1; audio, sinkronisasi, review terjadwal dan PWA adalah pengembangan terpisah. Tidak ada publikasi/deployment dalam pekerjaan ini.
