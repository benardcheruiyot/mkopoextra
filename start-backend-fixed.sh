#!/usr/bin/env bash
cd /var/www/talaextra/backend

echo "=== Start backend with PM2 (corrected) ==="
pm2 start src/server.js --name talacash-backend -i 2

sleep 3

echo ""
echo "=== PM2 Status ==="
pm2 list

echo ""
echo "=== Check port 5000 ==="
ss -lntp 2>&1 | grep 5000 || netstat -lntp 2>&1 | grep 5000 || echo "Port check pending..."

echo ""
echo "=== Test backend ==="
curl -s http://127.0.0.1:5000/ 2>&1 | head -5

echo ""
echo "=== Check nginx config needs update ==="
echo "PORT should now be 5000 instead of 4000"
