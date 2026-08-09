# Teater Sangsuropati — Aplikasi Absensi

Aplikasi absensi anggota teater berbasis QR code (React Native / Expo).

## Struktur
- `src/` — kode aplikasi mobile (Expo, jalan di Android/iOS via Expo Go)
- `server/` — backend API (Node.js + Express + SQLite)

## Fitur
- Login & registrasi anggota dan admin
- QR code unik untuk setiap anggota
- Scan QR untuk mencatat kehadiran
- Riwayat & data kehadiran dengan filter tanggal

## Menjalankan
```bash
# backend
cd server && npm install && node server.js

# aplikasi (Expo Go)
npm install
npm run start
```