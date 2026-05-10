# 📘 Dokumentasi Teknis Sistem Deteksi Drone (Low Cost Drone)

Dokumentasi ini memberikan penjelasan mendalam tentang arsitektur, alur data, dan teknologi yang digunakan dalam proyek **Low Cost Drone Detection System**.

---

## 1. Arsitektur Keseluruhan
Sistem ini terdiri dari tiga lapisan utama yang bekerja secara sinergis:
1.  **Sensor Layer (Edge)**: Node sensor mengirimkan data RF mentah (`data_hex`) ke Firebase.
2.  **Intelligence Layer (Backend ML)**: Server Node.js yang memproses data mentah menjadi informasi ancaman menggunakan AI.
3.  **Visualization Layer (Frontend Dashboard)**: Dashboard interaktif untuk pemantauan real-time.

---

## 2. Intelligence Layer (Backend ML)
Berpusat pada file `prediction-server.js`. Ini adalah "otak" dari seluruh sistem.

### Alur Kerja:
1.  **Firebase Polling**: Menggunakan `setInterval` setiap 2 detik untuk mengecek apakah ada `data_hex` baru di node sensor pada Firebase Realtime Database.
2.  **Inference Engine (ONNX)**:
    *   Model yang digunakan: `drone_detector_model.onnx`.
    *   **Preprocessing**: String Hex dikonversi menjadi array integer dan di-resize menjadi 63 fitur (sesuai kebutuhan input model).
    *   **Inference**: Menghasilkan 3 kemungkinan label: `WIFI ONLY` (1), `WIFI+BT` (2), dan `DRONE DETECTED` (3).
3.  **Real-time Broadcast**: Hasil prediksi tidak disimpan kembali ke database (untuk efisiensi), melainkan langsung dipancarkan ke semua client dashboard yang terhubung melalui **Socket.io**.

### Keunggulan:
*   **Decoupled**: ML tidak membebani database Firebase.
*   **Low Latency**: Menggunakan WebSocket untuk transmisi data instan.
*   **Persistence**: Memiliki in-memory store (`latestPredictionsStore`) sehingga client baru yang login langsung mendapatkan status terbaru tanpa menunggu polling berikutnya.

---

## 3. Visualization Layer (Frontend)
Dibangun menggunakan **Next.js 15** dengan pendekatan **Atomic Component**.

### Fitur Utama:
*   **Real-time Map (MapPanelClient.tsx)**:
    *   Menggunakan **React-Leaflet**.
    *   **Dynamic Markers**: Marker berdenyut (pulse) dengan kecepatan dan cahaya berbeda tergantung level ancaman (Merah = Bahaya/Cepat, Kuning = Waspada, Hijau = Aman/Lambat).
    *   **Auto-Recentering**: Peta otomatis bergeser ke lokasi Gateway saat data dimuat.
    *   **Perimeter Polygon**: Visualisasi area pantau menggunakan polygon transparan yang menghubungkan antar node.
*   **Dashboard Stats**: Ringkasan status gateway, jumlah node aktif, dan status jaringan RF secara keseluruhan.
*   **Alerts Panel**: Daftar riwayat deteksi yang masuk via socket, lengkap dengan data Hex asli untuk keperluan audit teknis.

### State Management:
*   **Socket Hook (`usePredictionSocket.ts`)**: Custom hook yang mengelola koneksi WebSocket dan menyimpan state prediksi terbaru serta history alerts.
*   **Firebase Hooks**: Mengelola sinkronisasi koordinat GPS dan data sensor statis (baterai, RSSI).

---

## 4. Alur Data (Data Flow)
1.  **Sensor** → Kirim `data_hex` ke **Firebase**.
2.  **Backend ML** → Polling `data_hex` dari **Firebase**.
3.  **Backend ML** → Jalankan **ONNX Inference**.
4.  **Backend ML** → Kirim hasil via **Socket.io**.
5.  **Dashboard UI** → Terima data socket → Update Peta & Statistik secara instan.

---

## 5. Konfigurasi Deployment
Untuk menjalankan sistem ini secara penuh di internet:

### Backend (Railway/VPS)
1.  Instal Node.js.
2.  Set environment variables Firebase.
3.  Jalankan `node prediction-server.js`.
4.  Pastikan port 4000 terbuka.

### Frontend (Vercel)
1.  Deploy folder project.
2.  Set `NEXT_PUBLIC_SOCKET_URL` ke alamat server Backend (misal: `https://ml-server.com`).
3.  Sistem otomatis terhubung.

---
**Catatan Teknis**: Sistem ini dirancang untuk skalabilitas tinggi di mana satu Backend ML dapat melayani ratusan Dashboard sekaligus secara real-time.
