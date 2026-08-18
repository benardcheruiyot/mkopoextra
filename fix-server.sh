#!/usr/bin/env bash
set -euxo pipefail

echo "=== STEP 0: Remove stale nginx and certbot processes ==="
for pid in $(ps -eo pid,comm --no-headers | awk '$2 ~ /nginx|certbot/ {print $1}'); do
  kill -9 "$pid" || true
done
sleep 2
ss -lntp | grep -E ':80|:443' || true

# Make sure the cert challenge can bind to port 80 cleanly.
certbot certonly --standalone --preferred-challenges http \
  -d talacash.mkopaji.com \
  -d www.talacash.mkopaji.com \
  --non-interactive \
  --agree-tos \
  -m admin@talacash.mkopaji.com

ls -ld /etc/letsencrypt/live/talacash.mkopaji.com
ls -l /etc/letsencrypt/live/talacash.mkopaji.com

echo "=== STEP 1: Write the final HTTPS nginx config ==="
mkdir -p /var/www/talaextra
cat > /etc/nginx/conf.d/talacash.conf <<'CONF'
server {
    listen 80;
    server_name talacash.mkopaji.com www.talacash.mkopaji.com;
    return 301 https://$host$request_uri;
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

nginx -t
nginx -s reload || nginx
sleep 2
curl -I --max-time 20 https://talacash.mkopaji.com || true

echo "=== DONE ==="
