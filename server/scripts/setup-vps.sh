#!/bin/bash
# Deploy server Absensi Teater Sangsuropati ke VPS Ubuntu/Debian
# Cara pakai: sudo bash setup-vps.sh <domain.duckdns.org>
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: sudo bash setup-vps.sh <domain.duckdns.org>"
  exit 1
fi

APP_DIR=/opt/absensi
PORT=3000
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Install Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> Copy server ke $APP_DIR"
mkdir -p "$APP_DIR"
cp -r "$REPO_DIR"/server/* "$APP_DIR"/
cd "$APP_DIR"
rm -rf node_modules package-lock.json
npm install

echo "==> Buat user absensi"
id -u absensi >/dev/null 2>&1 || useradd -r -m -s /usr/sbin/nologin absensi
chown -R absensi:absensi "$APP_DIR"

echo "==> Seed akun admin (default: admin/admin123)"
su absensi -s /bin/bash -c "cd $APP_DIR && node seed.js admin admin123 'Admin Teater'"

echo "==> Systemd unit"
cat > /etc/systemd/system/absensi.service <<EOF
[Unit]
Description=API Absensi Teater Sangsuropati
After=network.target

[Service]
Type=simple
User=absensi
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=5
Environment=PORT=$PORT

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now absensi.service
sleep 2
systemctl is-active absensi.service

echo "==> Install Caddy (HTTPS otomatis)"
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

cat > /etc/caddy/Caddyfile <<EOF
https://$DOMAIN {
  reverse_proxy 127.0.0.1:$PORT
  encode zstd gzip
}
EOF
systemctl reload caddy

echo
echo "==> SELESAI"
echo "    Domain : https://$DOMAIN"
echo "    Cek    : curl https://$DOMAIN/api/me"
echo "    (Pastikan port 80 & 443 terbuka di firewall VPS)"