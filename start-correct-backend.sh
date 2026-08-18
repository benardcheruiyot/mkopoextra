#!/usr/bin/env bash
set -euxo pipefail

echo "=== Install npm dependencies for correct backend ==="
cd /var/www/talaextra/backend
npm install

echo ""
echo "=== Check .env configuration ==="
if grep -q "APP_DOMAIN=talacash" .env; then
  echo "ENV is already configured for talacash"
else
  echo "Updating .env for talacash"
  sed -i 's/APP_DOMAIN=.*/APP_DOMAIN=talacash.mkopaji.com/' .env || true
  sed -i 's/CORS_ORIGIN=.*/CORS_ORIGIN=https:\/\/talacash.mkopaji.com/' .env || true
  grep "APP_DOMAIN\|CORS_ORIGIN\|PORT" .env
fi

echo ""
echo "=== Start correct backend with PM2 ==="
pm2 start src/server.js --name talacash-backend --instances 2 --exec-mode cluster
sleep 3

echo ""
echo "=== Verify backend is running ==="
pm2 list
ps aux | grep "node.*server.js" | grep -v grep

echo ""
echo "=== Check if port 4000 is listening ==="
ss -lntp | grep 4000 || echo "Checking with netstat..."
netstat -lntp 2>&1 | grep 4000 || echo "Port check pending..."
