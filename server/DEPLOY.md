# Deploy Server 24/7 ke Cloud

Server saat ini jalan di HP (dependen Acode + ngrok), itu sebabnya sering mati.
Berikut cara memindahkannya ke hosting 24 jam.

Server sudah disiapkan untuk cloud (di `server.js`):
- Jalur DB bisa diatur lewat env `DB_PATH` — wajib untuk Railway volume
- Akun admin (`admin`/`admin123`) otomatis dibuat saat DB kosong — tanpa seed manual
- Sudah listen `0.0.0.0:PORT`

## 1. Pilih provider

| Provider | Biaya | Disk persisten | Catatan |
|---|---|---|---|
| **Railway** | ~$5/bulan | Ya (volume) | Tanpa kelola server, HTTPS otomatis. **Paling simpel untuk aplikasi ini** |
| **Fly.io** | ~$2-3/bulan | Ya (volume) | VM penuh, Dockerfile, butuh CLI `flyctl` |
| **Oracle Cloud Always Free** | Gratis | Ya | Butuh kartu untuk verifikasi akun |
| **Hetzner / RackNerd / Contabo** | ~$4-6/bulan | Ya | VPS penuh, kontrol total |
| Render / Vercel (free tier) | gratis | Tidak | Data hilang saat restart + server "tidur". Tidak disarankan |

⚠️ Aturan penting: pilih hosting dengan **disk persisten** dan **selalu nyala** — data absensi ada di SQLite lokal.

## 2. Opsi A — Railway (paling disarankan, ~$5/bulan)

1. Push repo ini ke GitHub
2. Buka https://railway.app → **New Project** → **Deploy from GitHub** → pilih repo
3. **Root Directory**: `server`
4. Buat **Volume**: nama `data`, mount path `/data` — ⚠️ wajib, tanpa ini DB hilang tiap deploy
5. Tambah env vars:
   - `DB_PATH=/data/absensi.db`
   - `NIXPACKS_NODE_VERSION=22` — wajib, `server.js` butuh Node 22 (`node:sqlite`)
6. Railway otomatis kasih HTTPS gratis: `https://<nama>.up.railway.app`
7. Cek: `curl https://<nama>.up.railway.app/api/me` → `{"user":null}`
8. Login web dari HP: `admin` / `admin123`

Catatan Railway:
- Restart/redeploy = user login ulang (sesi di memori) — normal
- Backup DB: menu Volume → snapshot, atau download `absensi.db` berkala
- Tidak ada free tier, minimal ~$5/bulan (usage-based)

## 3. Opsi B — Fly.io (~$2-3/bulan, butuh `flyctl`)

File sudah disiapkan: `Dockerfile` (di `server/`) dan `fly.toml` (di root repo).

1. Install `flyctl` di laptop: `curl -L https://fly.io/install.sh | sh` (butuh akun + kartu)
2. Di root repo: `fly launch --no-deploy --name absensi-teater-sangsuropati`
3. Buat volume persisten (⚠️ wajib — tanpa ini DB hilang tiap deploy):
   ```bash
   fly volumes create data --size 1 --app absensi-teater-sangsuropati
   ```
4. Deploy: `fly deploy`
5. HTTPS otomatis: `https://absensi-teater-sangsuropati.fly.dev`
6. Cek: `curl https://absensi-teater-sangsuropati.fly.dev/api/me` → `{"user":null}`
7. Login web dari HP: `admin` / `admin123`

Catatan Fly.io:
- `fly.toml` sudah diset `min_machines_running = 1` → VM selalu hidup 24/7, auto-restart saat crash
- Restart/deploy = user login ulang (sesi di memori) — normal
- Backup DB: `fly ssh console` lalu copy `absensi.db`, atau snapshot volume

## 4. Opsi C — VPS sendiri (gratis OCI / ~$4-6 bulanan)

### a. Domain HTTPS — APK release Android memblokir HTTP plain

Pakai DuckDNS (gratis, tanpa kartu) + Caddy:

1. Buka https://duckdns.org → login (Google/GitHub) → **Add Domain** (misal `sangsuropati`)
2. Salin token-nya
3. Di VPS: `sudo bash install-duckdns.sh <token> <nama-domain>`

### b. Deploy

Dari laptop/PC (bukan dari HP):
```bash
scp -r server/* user@IP_VPS:/tmp/absensi/
ssh user@IP_VPS "sudo bash /tmp/absensi/scripts/setup-vps.sh sangsuropati.duckdns.org"
```

Yang dijalankan script:
- Node.js 22 + `npm install` di `/opt/absensi`
- systemd `absensi.service` — auto-restart saat crash / boot
- Caddy + Let's Encrypt → HTTPS otomatis
- Admin default `admin`/`admin123` dibuat otomatis

### c. Cek

```bash
curl https://sangsuropati.duckdns.org/api/me
```
Harusnya `{"user":null}`.

## 5. Update APK (wajib setelah URL ganti)

Domain berubah dari ngrok → URL baru. Minta opencode:
1. Ganti `extra.apiUrl` di `app.json` dengan URL baru
2. Build ulang APK + install ulang di semua HP

## Catatan
- Backup `absensi.db` berkala (mis. tiap malam ke Google Drive) — di Railway via snapshot volume, di VPS via rsync
- Tidak perlu ngrok lagi setelah pindah cloud