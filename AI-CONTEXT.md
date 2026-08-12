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

- **SEKARANG (produksi)**: server & ngrok jalan di **VPS Ubuntu** (rental Shopee, 157.66.54.166, SSH port 3014). VPS ini **NAT** — hanya port SSH 3014 yang terbuka dari luar, port 80/443 TIDAK bisa diakses publik → jangan coba pakai Caddy/Let's Encrypt di sini; **ngrok harus jalan di mesin yang sama** (sudah terpasang sebagai `ngrok.service` systemd, auto-restart).
  - Soal server: `absensi.service` systemd → `/opt/absensi` (Node 22, `node server.js`, DB di `/opt/absensi/absensi.db`; admin `admin`/`admin123` di-seed otomatis jika DB kosong)
  - Tunnel: `https://unfocused-algorithm-tables.ngrok-free.dev` (static domain dari akun ngrok pemilik, token ada di `/public/.config/ngrok/ngrok.yml` dan `/etc/ngrok/ngrok.yml` di VPS — keduanya di luar repo)
  - Caddy di VPS sudah di-disable (tidak berguna di NAT, gagal ambil sertifikat)
  - Watchdog di HP (`/public/.tools/watchdog.sh`) sekarang hanya menjaga server lokal untuk develop — **jangan** menyalakan ngrok di HP lagi (rebutan static domain dengan VPS)
- **Hubungan APK**: `extra.apiUrl` di `app.json` = alamat ngrok static di atas → APK yang terpasang TIDAK perlu di-build ulang selama URL itu tetap
- **Rencana cadangan**: file `server/Dockerfile`, `fly.toml`, `server/DEPLOY.md` tetap tersimpan untuk pindah ke Railway/Fly (~$2-5/bln) bila VPS rental habis masa sewanya
- ⚠️ Kalau URL berubah, wajib: ganti `extra.apiUrl` di `app.json` → rebuild APK → install ulang
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