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

    # Proxy all requests to backend which serves both frontend and API
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
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
curl -s -w "\nHTTP Status: %{http_code}\n" https://talacash.mkopaji.com 2>&1 | head -20

echo ""
echo "=== Testing API endpoint ==="
curl -s -w "\nHTTP Status: %{http_code}\n" https://talacash.mkopaji.com/api/ 2>&1 | head -10
