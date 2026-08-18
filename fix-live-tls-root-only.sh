#!/usr/bin/env bash
set -euxo pipefail

echo "=== Stopping stale nginx/certbot processes ==="
for pid in $(ps -eo pid,comm --no-headers | awk '$2 ~ /nginx|certbot/ {print $1}'); do
  kill -9 "$pid" || true
done
sleep 2

echo "=== Issuing certificate for root domain only ==="
certbot certonly --standalone --preferred-challenges http \
  -d talacash.mkopaji.com \
  --non-interactive \
  --agree-tos \
  -m admin@talacash.mkopaji.com

echo "=== Certificate issued, writing nginx config ==="
ls -ld /etc/letsencrypt/live/talacash.mkopaji.com
ls -l /etc/letsencrypt/live/talacash.mkopaji.com

mkdir -p /var/www/talaextra

cat > /etc/nginx/conf.d/talacash.conf <<'"'"'CONF'"'"'
server {
    listen 80;
    server_name talacash.mkopaji.com www.talacash.mkopaji.com;
    return 301 https://talacash.mkopaji.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name talacash.mkopaji.com www.talacash.mkopaji.com;

    ssl_certificate /etc/letsencrypt/live/talacash.mkopaji.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talacash.mkopaji.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/talaextra/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
CONF

echo "=== Testing and reloading nginx ==="
nginx -t
nginx -s reload || nginx
sleep 2

echo "=== Final HTTPS verification ==="
curl -I --max-time 20 https://talacash.mkopaji.com 2>&1 | head -20 || true
echo "=== DONE ==="
