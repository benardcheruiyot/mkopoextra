#!/usr/bin/env bash
cat > /etc/nginx/conf.d/talacash.conf <<'EOFNGINX'
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
        proxy_pass http://127.0.0.1:4000/api/;
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
EOFNGINX

echo "=== Testing nginx config ==="
nginx -t

echo ""
echo "=== Reloading nginx ==="
nginx -s reload

sleep 2

echo ""
echo "=== Testing HTTPS endpoint ==="
curl -I --max-time 20 https://talacash.mkopaji.com

echo ""
echo "=== Testing API endpoint ==="
curl -I --max-time 20 https://talacash.mkopaji.com/api/
