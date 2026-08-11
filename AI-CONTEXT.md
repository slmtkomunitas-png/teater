# AI-CONTEXT — Panduan Melanjutkan Proyek

File ini dibuat supaya AI lain (atau kamu sendiri) bisa langsung paham & lanjut bekerja tanpa menebak-nebak. Baca file ini dulu sebelum mengubah kode.

## Apa proyek ini

**Aplikasi absensi ekstrakurikuler Teater Sangsuropati** (Android, pakai QR code). Anggota punya QR pribadi, admin scan untuk mencatat kehadiran (1x per hari per orang). Ada laporan harian hadir/tidak hadir + export CSV.

## Arsitektur

- **Frontend**: Expo (React Native) — satu repo berisi `App.js`, `src/` (screens, api, komponen, tema)
- **Backend**: Node.js + Express + `node:sqlite` (SQLite built-in Node 22+) di folder `server/` — server mandiri, nurunin REST API JSON
- **Auth**: token acak disimpan di memori server (`Map`), client simpan token di AsyncStorage
  - ⚠️ Akibatnya: **restart server = semua user harus login ulang** (wajar, bukan bug)
- **DB**: `server/absensi.db` (SQLite). Seed admin otomatis saat DB kosong: `admin` / `admin123`

## Versi penting (jangan asal upgrade)

- `expo ~54.0.0`, React Native `0.81.5`, React `19.1.0` (lihat `package.json`)
- Server butuh **Node.js >= 22.5** (`node:sqlite`)
- ⚠️ AGENTS.md: baca docs Expo versi sesuai (`https://docs.expo.dev/versions/v57.0.0/` catatan dari pemilik repo)

## Cara jalanin lokal

```bash
# 1. Server (harus jalan dulu)
cd server && npm install && node server.js   # port 3000

# 2. App (dev mode, pakai expo)
npm install && npm start
```

Di mode dev, base URL otomatis dari host expo (`http://<ip-host>:3000`).

## Cara buat APK (release)

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`
(Tema/local history: pemilik sering build manual dengan minimalisasi R8 + filter ABI arm64/armv7 untuk APK kecil — lihat commit terdahulu)

## Hosting / deploy (status penting!)

- **Sekarang**: APK terpasang memakai `extra.apiUrl` = **alamat ngrok** (`https://unfocused-algorithm-tables.ngrok-free.dev`) di `app.json`. Ngrok jalan di HP (anak-proses Acode) → **kalau Acode/HP mati, server ikut mati → user kena "Login gagal, coba lagi"**. Ada watchdog `/public/.tools/watchdog.sh` (di luar repo) yang menyalakan ulang otomatis tiap 20 detik, tapi tetap tergantung HP.
- **Rencana**: pindah ke cloud 24/7. Sudah disiapkan:
  - `server/Dockerfile`, `fly.toml`, `.dockerignore` → Fly.io (~$2-3/bln)
  - `server/DEPLOY.md` → panduan Railway (~$5/bln) / Fly.io / VPS
  - `server/scripts/setup-vps.sh` + `install-duckdns.sh` → VPS + HTTPS DuckDNS/Caddy
- **Server sudah cloud-ready**: env `DB_PATH` untuk mengarahkan file SQLite, dan auto-seed admin saat DB kosong
- ⚠️ **Saat URL ganti (ngrok → cloud), wajib:**
  1. Ganti `extra.apiUrl` di `app.json`
  2. Rebuild APK (`expo prebuild` + `assembleRelease`)
  3. Install ulang di semua HP
- ⚠️ APK release Android **memblokir HTTP plain** — URL harus `https://`

## Tips kalau user lapor bug

1. Cek dulu server hidup? `curl http://localhost:3000/api/me` (kalau di lingkungan HP seperti sekarang)
2. Cek tunnel publik: `curl https://<apiUrl>/api/me`
3. Cek `server.log` / `watchdog.log` di `/public/.tools/`
4. "Login gagal, coba lagi" = server merespons tapi bukan JSON yang benar (biasanya ngrok 404 karena tunnel mati)

## Struktur file penting

```
App.js                    # routing login/anggota/admin
src/api.js                # base URL, fetch wrapper, token AsyncStorage
src/theme.js              # warna temanya emas-gelap
src/components.js         # Header (dgn logo), Kartu, Chip, Stat, Avatar
src/screens/LoginScreen.js
src/screens/AdminScreen.js    # scan QR + manual, buat akun, data absensi
src/screens/AnggotaScreen.js  # kartu QR, status Sabtu, riwayat
src/screens/KegiatanPanel.js  # laporan hadir/tidak + unduh CSV
server/server.js          # SEMUA API (auth, users, absensi, laporan CSV)
server/seed.js            # seed/ubah admin (cara lama; skip — auto-seed sudah ada)
server/DEPLOY.md          # panduan pindah ke cloud
```

## Gaya commit (ikutin riwayat)

`feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:` — bahasa Indonesia/Inggris campur, singkat padat.

## Yang sering salah dilupakan

- Jangan commit `server/absensi.db`, `node_modules`, APK, token/credentials
- **Repo ini PUBLIC di GitHub** — jangan pernah memasukkan key/rahasia: ngrok authtoken ada di `/public/.config/ngrok/ngrok.yml` (di luar repo), kredensial ada di `.git-credentials` (di luar repo). Secret deploy harus lewat env vars / GitHub Secrets, bukan di file.
- Sesuatu yang menyangkut Expo: cek dulu versi yang dipakai pemilik (`expo ~54`) sebelum berikut npm install versi baru
- Server pakai Express 5 — API-nya beda tipis dari Express 4 (mis. middleware handling error)