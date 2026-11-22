# Ultimate Party Battle — Web Edition

Proyek awal game party battle 3D multiplayer berbasis browser. Dibuat agar dapat dikembangkan dan dikelola dari HP Android melalui GitHub dan layanan hosting Node.js.

## Fitur yang sudah ada di source code
- Membuat room dengan kode undangan 5 karakter.
- Bergabung ke room menggunakan kode.
- Batas 2–10 pemain per room.
- Arena 3D sederhana menggunakan Three.js.
- Karakter pemain dengan warna berbeda.
- Kontrol keyboard dan tombol sentuh.
- Mini-game awal: mengumpulkan koin selama 90 detik.
- Skor dan peringkat pemain.
- Server multiplayer menggunakan Socket.IO.

## Yang belum ada / belum diuji
- Source code ini belum di-deploy ke server publik.
- Multiplayer internet belum teruji sampai server di-host dan dicoba dari minimal dua perangkat/browser.
- Belum ada akun, sistem keamanan anti-cheat tingkat lanjut, matchmaking publik, voice chat, atau beberapa mini-game tambahan.
- Model karakter dan arena masih prototipe sederhana, bukan grafis realistis setara game PC.
- CDN Three.js dan Google Fonts memerlukan internet.

## Deploy melalui HP Android dengan GitHub + Render
1. Buat repository GitHub baru atau gunakan repository web terpisah.
2. Upload seluruh isi folder proyek ini, termasuk `package.json`, `server.js`, `public/`, dan `README_ID.md`.
3. Buka https://render.com dan buat akun / masuk.
4. Pilih **New** → **Web Service**.
5. Hubungkan repository GitHub.
6. Runtime: **Node**.
7. Build Command: `npm install`
8. Start Command: `npm start`
9. Pilih paket hosting yang mendukung layanan web yang selalu aktif sesuai kebutuhan.
10. Deploy. Setelah status Live, buka URL Render dari browser Android.

## Cara bermain
1. Buka URL website.
2. Masukkan nama.
3. Pemain pertama tekan **Buat Room**.
4. Bagikan kode 5 karakter ke teman.
5. Teman memasukkan kode lalu tekan **Gabung**.
6. Setelah minimal dua pemain masuk, tekan **Mulai Battle**.
7. Gunakan tombol arah di layar untuk mengambil koin.
8. Pemain dengan koin terbanyak setelah 90 detik menang.

## Catatan teknis
Server menyimpan posisi dan skor pemain. Ini adalah fondasi multiplayer sederhana, belum merupakan sistem kompetitif anti-cheat. Untuk rilis publik perlu validasi gerakan, rate limiting, moderasi nama, logging, dan pengujian beban.
