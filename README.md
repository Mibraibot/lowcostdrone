# 🛰️ Low Cost Drone Detection Dashboard

Sistem pemantauan drone real-time berbasis Web dengan integrasi Machine Learning (ONNX) dan Firebase. Dashboard ini dirancang untuk mendeteksi keberadaan drone berdasarkan data RF (Radio Frequency) yang dipolling secara real-time dari sensor lapangan.

## 🏗️ Arsitektur Sistem

Proyek ini menggunakan arsitektur **Dual-Backend** untuk memastikan performa maksimal dan pemisahan logika yang bersih:

### 1. Frontend (Next.js Dashboard)
- **Tech Stack**: Next.js 15+, TailwindCSS, Leaflet.js (Maps), Socket.io-client.
- **Fungsi**: Visualisasi data real-time, manajemen lokasi gateway/node, dan notifikasi ancaman.
- **Data Source**: Menerima stream prediksi langsung dari `prediction-server.js` melalui WebSocket (Socket.io).

### 2. ML Backend (Prediction Server)
- **File**: `prediction-server.js`
- **Tech Stack**: Node.js, ONNX Runtime, Socket.io, Firebase Admin SDK.
- **Fungsi**: 
  - **Polling**: Mengambil data `data_hex` mentah dari Firebase setiap 2 detik.
  - **Inference**: Menjalankan model `drone_detector_model.onnx` untuk mengklasifikasi ancaman.
  - **Broadcast**: Mengirimkan hasil prediksi (Safe/Warning/Drone) langsung ke semua dashboard yang aktif.

### 3. Database (Firebase Realtime)
- **Fungsi**: Penyimpanan data mentah dari sensor (RSSI, Battery, SNR, Hex Data) dan konfigurasi statis koordinat GPS untuk Gateway dan Nodes.

---

## 🚀 Cara Menjalankan (Local Development)

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Akun Firebase dengan Realtime Database yang sudah aktif.
- File `.env.local` yang berisi kredensial Firebase.

### 2. Jalankan ML Backend (Mesin Prediksi)
Buka terminal baru dan jalankan:
```bash
# Install dependencies (jika belum)
npm install

# Jalankan server prediksi
node prediction-server.js
```
Server akan berjalan di `http://localhost:4000`.

### 3. Jalankan Frontend (Dashboard)
Buka terminal lainnya dan jalankan:
```bash
# Jalankan dashboard Next.js
npm run dev
```
Dashboard dapat diakses di `http://localhost:3000`.

---

## 🌐 Panduan Deployment

### Frontend (Vercel)
- Hubungkan repositori GitHub ke Vercel.
- Tambahkan Environment Variables dari `.env.local`.
- Tambahkan `NEXT_PUBLIC_SOCKET_URL` yang mengarah ke URL Backend ML Anda.

### Backend ML (Railway / Render / VPS)
- **PENTING**: Backend ini tidak bisa di-deploy di Vercel karena membutuhkan proses yang berjalan terus-menerus (Long-polling & WebSocket).
- Gunakan platform seperti **Railway.app** atau **VPS (Ubuntu)** dengan **PM2**.
- Perintah jalankan: `node prediction-server.js`.

---

## 🛠️ Fitur Utama
- **Real-time Map**: Visualisasi posisi node dan gateway sesuai koordinat di Firebase.
- **Dynamic Icons**: Marker di peta berubah warna (Hijau/Kuning/Merah) dan berdenyut sesuai tingkat ancaman.
- **Perimeter Monitor**: Garis batas otomatis yang menghubungkan antar node (1-2-3-1).
- **Hex Data Viewer**: Tampilan data mentah lengkap untuk keperluan audit signal.
- **Compact UI**: Desain dashboard yang optimal untuk layar laptop tanpa perlu scrolling.

---
**Developed with ❤️ for Advanced Drone Monitoring.**
