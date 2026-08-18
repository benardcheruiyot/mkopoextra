#!/usr/bin/env bash
echo "=== Check if backend port 5000 is listening ==="
netstat -lntp 2>&1 | grep -i 5000 || ss -lntp 2>&1 | grep 5000 || echo "Port 5000 is NOT listening"

echo ""
echo "=== Check Node processes and ports ==="
ps aux | grep -i node | grep -v grep

echo ""
echo "=== Check PM2 detailed info ==="
pm2 info cana-backend

echo ""
echo "=== Try direct localhost:5000 connection ==="
curl -s --max-time 5 http://127.0.0.1:5000 2>&1 | head -10 || echo "Failed to connect to 127.0.0.1:5000"

echo ""
echo "=== HTTPS test via nginx proxy ==="
curl -s -I --max-time 10 https://127.0.0.1 2>&1 || echo "HTTPS test via localhost failed"
