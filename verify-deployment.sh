#!/usr/bin/env bash
echo "=== Certificate Valid Until ==="
openssl x509 -in /etc/letsencrypt/live/talacash.mkopaji.com/cert.pem -noout -dates

echo ""
echo "=== Certificate Subject ==="
openssl x509 -in /etc/letsencrypt/live/talacash.mkopaji.com/cert.pem -noout -subject

echo ""
echo "=== Backend PM2 Status ==="
pm2 list 2>&1 || echo "PM2 not initialized"

echo ""
echo "=== Port 5000 Listening ==="
netstat -lntp 2>&1 | grep 5000 || ss -lntp 2>&1 | grep 5000 || echo "Port 5000 not listening"

echo ""
echo "=== HTTPS Response Status ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -k https://talacash.mkopaji.com
