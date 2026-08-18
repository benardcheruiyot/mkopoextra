#!/usr/bin/env bash
echo "=== Backend .env file ==="
cat /root/cana/backend/.env || echo "No .env found"

echo ""
echo "=== Check index.js for port config ==="
grep -i "port\|listen" /root/cana/backend/index.js | head -20

echo ""
echo "=== Check backend stdout logs ==="
tail -30 /root/.pm2/logs/cana-backend-out-4.log

echo ""
echo "=== Check backend error logs ==="
tail -30 /root/.pm2/logs/cana-backend-error-4.log
