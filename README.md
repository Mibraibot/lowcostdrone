# 🛰️ Low Cost Drone Detection Dashboard

Sistem pemantauan drone real-time berbasis Web yang terintegrasi secara langsung dengan Firebase Realtime Database. Dashboard ini dirancang untuk memantau status ancaman drone dan memvisualisasikan data telemetri dari node sensor lapangan secara langsung tanpa perantara backend server tambahan.

## 🏗️ Arsitektur Sistem

Proyek ini dirancang secara serverless & modular dengan pemisahan logika yang bersih:

### 1. Frontend (Next.js Dashboard)
- **Tech Stack**: Next.js 15+, TailwindCSS, Leaflet.js (Maps).
- **Fungsi**: Visualisasi data real-time, manajemen lokasi gateway/node, dan notifikasi ancaman.
- **Logika & Keamanan**: Seluruh logika perhitungan data sensor, status koneksi, dan pemrosesan koordinat dipisahkan dari layer UI (disimpan di folder `utils/`).
- **Data Source**: Berlangganan (subscribe) langsung ke data Firebase Realtime Database secara real-time pada node `Timeseries` dan `gateway`.

### 2. Database (Firebase Realtime)
- **Fungsi**: Pusat penyimpanan data status sensor (RSSI, SNR, Hex Data, timestamp) dan konfigurasi koordinat GPS untuk Gateway serta masing-masing Nodes.

---

## 📂 Struktur Logika & Kode (Refactored)

Sistem telah di-refactor agar memiliki performa maksimal, skalabel, serta bebas dari kode perhitungan di dalam tata letak UI (layout components):

- **`types/drone.types.ts`**: Sumber kebenaran tunggal untuk definisi semua tipe data.
- **`utils/connection.ts`**: Logika penentuan status koneksi node (status berubah menjadi *Disconnected* apabila data pada node tidak diperbarui selama **40 detik**).
- **`utils/prediction.ts`**: Logika parsing status biner ("Aman" atau "Drone Terdeteksi") dan perhitungan cakupan status RF.
- **`utils/geo.ts`**: Logika pemrosesan geografis seperti pemusatan peta otomatis di titik tengah armada (*fleet center*), penghitungan koordinat, serta format koordinat.
- **`utils/threat.ts`**: Konfigurasi tingkat ancaman dan tema visual untuk UI.
- **`hooks/useTimeseries.ts`**: Hook reactivity untuk sinkronisasi data *Timeseries* dari Firebase ke dalam aplikasi.

---

## 🚀 Cara Menjalankan (Local Development)

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Akun Firebase dengan Realtime Database yang sudah aktif.
- File `.env.local` di root folder proyek berisi kredensial database Firebase:
  ```env
  NEXT_PUBLIC_FIREBASE_API_KEY=your_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
  NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-rtdb.firebaseio.com/
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
  ```

### 2. Jalankan Dashboard
```bash
# Install dependensi proyek
npm install

# Jalankan server lokal Next.js
npm run dev
```
Buka `http://localhost:3000` pada browser Anda untuk mengakses aplikasi.

---

## 🌐 Panduan Deployment (Vercel)

Karena arsitektur dashboard ini sepenuhnya menggunakan arsitektur serverless (terhubung langsung ke Firebase), Anda dapat men-deploy aplikasi secara gratis dan mudah di Vercel:
1. Hubungkan repositori GitHub Anda ke Vercel.
2. Masukkan semua konfigurasi di atas ke dalam menu **Environment Variables** di Vercel.
3. Klik **Deploy** dan aplikasi Anda sudah online.

---

## 🛠️ Fitur Utama
- **Real-time Map Integration**: Visualisasi posisi node dan gateway yang langsung tersinkronisasi dari Firebase.
- **Smart Fleet Center**: Peta secara dinamis memosisikan kamera di tengah-tengah antara Gateway dan gerombolan Node agar visual seimbang.
- **Binary Threat Alerting**: Hanya mendeteksi status biner: **Safe (Aman)** atau **Critical (Drone Terdeteksi)**. Marker di peta akan otomatis berwarna hijau (Aman) atau berdenyut warna merah (Drone Terdeteksi).
- **Auto-Disconnect Watcher**: Deteksi otomatis status kegagalan komunikasi LoRa/Node yang otomatis berubah ke warna merah (Disconnected) setelah 40 detik data tidak berubah.
- **Compact & Clean UI**: Tata letak yang dioptimalkan agar muat dalam satu layar tanpa perlu melakukan scrolling, sangat cocok untuk layar monitor di command center.

---
**Developed with ❤️ for Advanced Serverless Drone Monitoring.**
