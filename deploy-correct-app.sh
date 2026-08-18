#!/usr/bin/env bash
set -euxo pipefail

echo "=== Stopping wrong backend ==="
pm2 stop cana-backend || true
pm2 delete cana-backend || true
sleep 2

echo ""
echo "=== Cloning correct repo to /var/www/talaextra ==="
rm -rf /var/www/talaextra
mkdir -p /var/www
git clone https://github.com/bchemnet/talamkopo.git /var/www/talaextra
cd /var/www/talaextra
git checkout main

echo ""
echo "=== Installing backend dependencies ==="
cd /var/www/talaextra/backend
npm install

echo ""
echo "=== Setting up backend .env ==="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "PORT=4000" >> .env
  echo "NODE_ENV=production" >> .env
  echo "CORS_ORIGIN=https://talacash.mkopaji.com" >> .env
fi

echo ""
echo "=== Starting correct backend with PM2 ==="
pm2 start src/server.js --name talacash-backend --instances 2 --exec-mode cluster
sleep 3

echo ""
echo "=== Verify new backend is running ==="
pm2 list
netstat -lntp 2>&1 | grep 4000 || ss -lntp | grep 4000
