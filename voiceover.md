# 🎬 Narasi Video Demonstrasi Sistem LCDD

**LCDD — Low Cost Drone Detection**
Skrip Narasi (Voice-Over) untuk Video Dokumentasi & Demonstrasi Sistem

> **Cara pakai skrip ini:**
> - Teks di bawah label **🎙️ NARASI** dibaca sebagai suara/voice-over.
> - Teks di dalam kurung siku **`[VISUAL: ...]`** adalah petunjuk gambar/aksi yang harus terlihat di layar saat narasi dibacakan (bukan untuk dibaca).
> - Estimasi total durasi: **± 6–8 menit**. Sesuaikan tempo bicara agar pas dengan rekaman.

---

## 🗺️ Ringkasan Alur Cerita Video

| Segmen | Isi | Estimasi |
|--------|-----|----------|
| 1 | Pembuka & Latar Belakang | 45 dtk |
| 2 | Gambaran Umum & Arsitektur Sistem | 60 dtk |
| 3 | Demonstrasi Sensor Node | 75 dtk |
| 4 | Demonstrasi Gateway | 75 dtk |
| 5 | Jembatan Data & Firebase | 45 dtk |
| 6 | Demonstrasi Dashboard | 75 dtk |
| 7 | Skenario Deteksi Drone (Puncak Demo) | 75 dtk |
| 8 | Fitur Ketahanan Sistem | 45 dtk |
| 9 | Penutup | 30 dtk |

---

## SEGMEN 1 — PEMBUKA & LATAR BELAKANG

`[VISUAL: Judul "LCDD — Low Cost Drone Detection" muncul di layar. Cuplikan singkat perangkat node, gateway, dan tampilan dashboard secara bergantian (montage cepat).]`

**🎙️ NARASI:**
> "Ancaman drone di area terbatas — seperti bandara, fasilitas vital, atau kawasan pertahanan — terus meningkat, sementara sistem pendeteksi drone komersial umumnya sangat mahal. Berangkat dari masalah itu, kami mengembangkan **LCDD**, singkatan dari **Low Cost Drone Detection**: sebuah sistem deteksi drone berbiaya rendah yang memanfaatkan pemindaian spektrum frekuensi radio.
>
> Dalam video ini, kami akan mendemonstrasikan cara kerja sistem LCDD secara menyeluruh — mulai dari sensor node di lapangan, gateway pengumpul data, hingga dashboard pemantauan real-time yang dapat diakses dari mana saja."

---

## SEGMEN 2 — GAMBARAN UMUM & ARSITEKTUR SISTEM

`[VISUAL: Tampilkan diagram arsitektur: Sensor Node → (LoRa 433 MHz) → Gateway → (Serial/USB) → Bridge Python → (Internet) → Firebase → Dashboard Web. Setiap komponen disorot satu per satu mengikuti narasi.]`

**🎙️ NARASI:**
> "Secara garis besar, sistem LCDD terdiri dari empat komponen utama yang saling terhubung.
>
> **Pertama, Sensor Node.** Ini adalah perangkat yang diletakkan di lapangan untuk memindai spektrum frekuensi 2,4 gigahertz — frekuensi yang umum dipakai untuk kendali dan video drone. Setiap node dibangun menggunakan mikrokontroler ESP32, modul nRF24 sebagai pemindai spektrum, modul LoRa sebagai radio komunikasi, dan layar OLED untuk indikator status.
>
> **Kedua, Gateway.** Gateway bertugas memanggil setiap node secara bergiliran, mengumpulkan hasil pemindaian, sekaligus menjaga sinkronisasi waktu seluruh perangkat.
>
> **Ketiga, Jembatan Data dan Firebase.** Data dari gateway diteruskan ke Firebase Realtime Database yang berfungsi sebagai pusat penyimpanan data secara langsung.
>
> **Keempat, Dashboard Web.** Dashboard menampilkan seluruh data secara real-time di peta, lengkap dengan status ancaman dan notifikasi.
>
> Yang menarik, komunikasi antara node dan gateway menggunakan **LoRa di frekuensi 433 megahertz** — sehingga jangkauannya jauh dengan konsumsi daya yang sangat hemat. Sementara komunikasi dari sensor drone-nya sendiri memindai frekuensi 2,4 gigahertz."

---

## SEGMEN 3 — DEMONSTRASI SENSOR NODE

`[VISUAL: Close-up perangkat Sensor Node. Nyalakan perangkat. Tampilkan layar OLED yang menampilkan proses "Waiting Sync From Gateway...".]`

**🎙️ NARASI:**
> "Mari kita mulai dari Sensor Node. Saat pertama dinyalakan, node tidak langsung bekerja — ia menunggu sinyal sinkronisasi waktu dari gateway. Ini penting agar setiap data yang dikirim memiliki penanda waktu yang akurat dan seragam di seluruh jaringan.
>
> Perhatikan layar. Node menampilkan tulisan **'Waiting Sync From Gateway'**. Begitu sinyal waktu diterima, layar akan berubah menjadi **'Sync Success'**, dan node masuk ke mode Standby."

`[VISUAL: Layar OLED berubah ke "SYNC SUCCESS!" lalu ke layar Standby bertuliskan "Hello, LCDD".]`

**🎙️ NARASI:**
> "Di mode Standby, node menampilkan identitasnya — LCDD, Low Cost Drone Detection. Setiap node memiliki ID unik, misalnya Node1, Node2, dan Node3, sehingga gateway dapat memanggilnya satu per satu.
>
> Node dikendalikan hanya dengan satu tombol. **Satu kali tekan** untuk berpindah antara mode Standby dan mode Deteksi. **Dua kali tekan** untuk menampilkan informasi node."

`[VISUAL: Tekan tombol satu kali. Layar berpindah ke mode Deteksi menampilkan "WAITING Gateway Poll" dengan animasi spinner berputar.]`

**🎙️ NARASI:**
> "Sekarang saya masuk ke mode Deteksi. Di sini node siap dipanggil oleh gateway. Ketika gateway mengirim perintah panggil, node akan langsung menjalankan pemindaian spektrum menggunakan modul nRF24.
>
> Modul ini memindai seratus dua puluh lima kanal frekuensi 2,4 gigahertz, lalu mengubah hasilnya menjadi peta biner — di mana setiap kanal ditandai apakah terdeteksi aktivitas sinyal atau tidak. Hasil pemindaian inilah yang dikirim kembali ke gateway melalui LoRa, bersama ID node dan penanda waktu."

`[VISUAL: Saat gateway memanggil, layar node berubah sekejap menjadi "Sending To Gateway...".]`

**🎙️ NARASI:**
> "Setiap kali node berhasil membalas panggilan, layar menampilkan **'Sending To Gateway'** sebagai konfirmasi bahwa data telah dikirim."

---

## SEGMEN 4 — DEMONSTRASI GATEWAY

`[VISUAL: Close-up perangkat Gateway. Nyalakan. Tampilkan boot screen "Welcome To Gateway LCDD" dengan progress bar, lalu proses "Connecting to WiFi".]`

**🎙️ NARASI:**
> "Sekarang beralih ke Gateway. Saat dinyalakan, gateway pertama-tama menghubungkan diri ke jaringan WiFi. Perlu ditegaskan, WiFi di sini **hanya digunakan untuk mengambil waktu akurat dari server NTP** — bukan untuk mengirim data ke internet. Waktu diselaraskan ke zona waktu WIB, yaitu UTC plus tujuh.
>
> Setelah waktu didapat, gateway langsung menyiarkan sinkronisasi waktu ke semua node, lalu masuk ke mode Listening."

`[VISUAL: Layar OLED gateway menampilkan mode "LSTN" dengan jam berjalan, "Poll: Node...", "LoRa RSSI: ... dBm", dan potongan pesan data.]`

**🎙️ NARASI:**
> "Di mode Listening, gateway bekerja dengan pola **polling bergiliran**. Ia memanggil Node1, menunggu balasan, lalu berpindah ke Node2, kemudian Node3, dan kembali lagi ke Node1 — terus berputar.
>
> Perhatikan layar gateway. Baris **Poll** menunjukkan node mana yang sedang dipanggil. Baris **LoRa RSSI** menampilkan kekuatan sinyal balasan dalam satuan dBm — semakin mendekati nol, semakin kuat sinyalnya. Dan baris **Msg** menampilkan cuplikan data mentah yang baru saja diterima.
>
> Setiap kali gateway menerima balasan, ia mencatat kekuatan sinyal RSSI, kualitas sinyal SNR, dan isi data pemindaian, lalu meneruskannya melalui koneksi serial ke komputer."

`[VISUAL: Tekan tombol Info gateway (double click) untuk menampilkan "GATEWAY INFO": status WiFi, NTP, LoRa, dan jumlah node.]`

**🎙️ NARASI:**
> "Gateway juga memiliki layar informasi yang bisa dipanggil dengan menekan tombol dua kali. Layar ini menampilkan status kesehatan sistem secara ringkas — status WiFi, status sinkronisasi waktu NTP, status radio LoRa, serta jumlah node yang sedang dipantau."

---

## SEGMEN 5 — JEMBATAN DATA & FIREBASE

`[VISUAL: Layar komputer/terminal menampilkan output serial gateway berupa blok JSON (event: data_received, rssi, snr, payload). Lalu tampilkan konsol Firebase Realtime Database dengan data yang masuk di node "Timeseries" dan "gateway".]`

**🎙️ NARASI:**
> "Data yang keluar dari gateway berbentuk JSON — berisi kekuatan sinyal, kualitas sinyal, dan hasil pemindaian dari node. Sebuah program jembatan berbasis Python membaca data ini dari port serial, lalu mengunggahnya ke **Firebase Realtime Database**.
>
> Firebase berperan sebagai pusat data langsung. Begitu data baru masuk, ia tersimpan di dalam node data 'Timeseries' dan 'gateway', dan tersedia seketika untuk ditampilkan. Dengan pola ini, sistem tidak memerlukan server backend tambahan — arsitekturnya sepenuhnya **serverless**."

---

## SEGMEN 6 — DEMONSTRASI DASHBOARD

`[VISUAL: Buka dashboard web di browser (localhost:3000 atau URL Vercel). Tampilkan tampilan penuh: peta, panel statistik, dan panel status.]`

**🎙️ NARASI:**
> "Inilah tampilan akhir yang dilihat operator: **Dashboard Pemantauan LCDD**. Dashboard ini dibangun dengan Next.js dan terhubung langsung ke Firebase, sehingga setiap perubahan data langsung tercermin di layar tanpa perlu me-refresh halaman.
>
> Di bagian tengah terdapat **peta interaktif**. Setiap sensor node dan gateway ditampilkan sebagai penanda di peta sesuai koordinat GPS-nya. Peta ini pintar — ia otomatis memposisikan kamera di titik tengah antara gateway dan seluruh node, sehingga semua perangkat selalu terlihat seimbang di layar."

`[VISUAL: Sorot panel Overview dan panel statistik yang menampilkan jumlah node, status koneksi, RSSI, dan SNR.]`

**🎙️ NARASI:**
> "Di sekelilingnya terdapat beberapa panel. **Panel Overview** merangkum kondisi seluruh armada sensor. **Panel statistik** menampilkan detail teknis tiap node — mulai dari kekuatan sinyal, kualitas sinyal, hingga waktu data terakhir diterima.
>
> Ada pula **Panel Pengaturan**, tempat operator dapat mengatur koordinat lokasi gateway dan tiap node. Menariknya, lokasi node diatur dari dashboard ini, bukan diprogram ulang ke perangkat."

---

## SEGMEN 7 — SKENARIO DETEKSI DRONE (PUNCAK DEMONSTRASI)

`[VISUAL: Persiapkan sebuah drone / remote control drone di dekat salah satu node. Tampilkan split-screen bila memungkinkan: perangkat node di satu sisi, dashboard di sisi lain.]`

**🎙️ NARASI:**
> "Sekarang bagian yang paling penting — pengujian deteksi drone secara langsung.
>
> Dalam kondisi aman, seluruh penanda node di peta berwarna **hijau**, menandakan status 'Aman'. Tidak ada aktivitas sinyal drone yang terdeteksi di sekitar node."

`[VISUAL: Nyalakan drone / remote control drone di dekat node. Tunggu beberapa saat.]`

**🎙️ NARASI:**
> "Sekarang saya nyalakan drone di dekat salah satu node. Sinyal kendali dan video drone yang bekerja di frekuensi 2,4 gigahertz akan tertangkap oleh pemindai nRF24 pada node tersebut.
>
> Perhatikan dashboard..."

`[VISUAL: Penanda node di peta berubah dari hijau menjadi merah berdenyut. Panel Alerts memunculkan notifikasi "Drone Terdeteksi".]`

**🎙️ NARASI:**
> "...dan seketika, penanda node berubah menjadi **merah berdenyut**, disertai notifikasi peringatan **'Drone Terdeteksi'** di panel alert. Sistem menerjemahkan lonjakan aktivitas sinyal menjadi status ancaman secara biner: **Aman** atau **Drone Terdeteksi**.
>
> Karena setiap node berada di lokasi berbeda, operator dapat langsung mengetahui **di area mana** aktivitas drone terdeteksi, hanya dengan melihat penanda mana yang menyala merah di peta."

`[VISUAL: Matikan drone. Setelah beberapa saat, penanda kembali hijau.]`

**🎙️ NARASI:**
> "Ketika drone dimatikan dan aktivitas sinyal menghilang, node kembali melaporkan status aman, dan penanda di peta kembali berwarna hijau. Seluruh proses ini terjadi secara otomatis dan real-time."

---

## SEGMEN 8 — FITUR KETAHANAN SISTEM

`[VISUAL: Matikan salah satu node. Tampilkan dashboard: setelah ± 40 detik, penanda node berubah menjadi status "Disconnected".]`

**🎙️ NARASI:**
> "Sistem LCDD juga dirancang tahan terhadap gangguan. Bila sebuah node berhenti mengirim data — misalnya karena mati atau kehilangan sinyal — dashboard otomatis menandainya sebagai **Disconnected** setelah empat puluh detik tanpa pembaruan data.
>
> Di sisi gateway, node yang tidak merespons tidak akan menghambat node lain. Gateway secara cerdas melewati node yang sedang offline dan hanya sesekali mencoba memanggilnya kembali, sehingga node yang sehat tetap dipantau dengan kecepatan penuh.
>
> Bahkan, baik node maupun gateway memiliki kemampuan **pemulihan mandiri** — jika modul radio terdeteksi macet, perangkat akan otomatis me-reset dan mengonfigurasi ulang radionya tanpa perlu campur tangan manusia."

---

## SEGMEN 9 — PENUTUP

`[VISUAL: Kembali ke tampilan penuh dashboard dengan seluruh node aktif dan hijau. Perlahan fade ke layar judul/logo LCDD.]`

**🎙️ NARASI:**
> "Itulah demonstrasi sistem **LCDD — Low Cost Drone Detection**. Sebuah sistem deteksi drone yang **terjangkau, modular, dan real-time**: memanfaatkan pemindaian spektrum radio pada sensor node, komunikasi LoRa jarak jauh yang hemat daya ke gateway, dan dashboard serverless yang dapat diakses dari mana saja.
>
> Dengan biaya yang jauh lebih rendah dibanding solusi komersial, LCDD membuktikan bahwa sistem peringatan dini terhadap ancaman drone dapat dibangun secara mandiri dan efisien.
>
> Terima kasih telah menyaksikan. Semoga bermanfaat."

`[VISUAL: Layar penutup — logo/judul LCDD, nama tim/pengembang, dan kontak bila perlu.]`

---

### 📌 Catatan Teknis untuk Pengambilan Gambar

- **Rekam layar OLED** node & gateway dari dekat (macro) agar teks terbaca jelas.
- **Rekam layar dashboard** langsung dari browser (screen recording) untuk hasil paling tajam, lalu gabungkan dengan rekaman fisik perangkat.
- Untuk **Segmen 7**, siapkan pengambilan ulang (retake) — perubahan warna penanda mungkin butuh beberapa detik setelah drone dinyalakan (bergantung giliran polling gateway).
- Jaga agar gateway tetap terhubung ke komputer/bridge selama perekaman dashboard, agar data benar-benar mengalir.
- Pertimbangkan menambahkan **teks keterangan (lower-third)** di layar untuk istilah teknis seperti *RSSI*, *SNR*, *LoRa*, dan *nRF24*.
