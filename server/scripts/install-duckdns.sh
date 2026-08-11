#!/bin/bash
# Update IP DuckDNS tiap 5 menit. Jalankan: sudo bash install-duckdns.sh
set -euo pipefail

TOKEN="${1:-}"
DOMAIN="${2:-}"
if [ -z "$TOKEN" ] || [ -z "$DOMAIN" ]; then
  echo "Usage: sudo bash install-duckdns.sh <duckdns-token> <namasubdomain>"
  echo "Buat dulu: https://duckdns.org -> log in dengan akun (Google/GitHub) lalu Add Domain"
  exit 1
fi

cat > /usr/local/bin/duckdns.sh <<EOF
#!/bin/bash
TOKEN="$TOKEN"
DOMAIN="$DOMAIN"
curl -fsS -k "https://www.duckdns.org/update?domains=\$DOMAIN&token=\$TOKEN&ip=" > /dev/null 2>&1
EOF
chmod +x /usr/local/bin/duckdns.sh

# Cron tiap 5 menit
(crontab -l 2>/dev/null | grep -v duckdns.sh; echo "*/5 * * * * /usr/local/bin/duckdns.sh") | crontab -

/usr/local/bin/duckdns.sh
echo "IP berhasil didaftarkan untuk ${DOMAIN}.duckdns.org"
echo "Lalu jalankan: sudo bash setup-vps.sh ${DOMAIN}.duckdns.org"