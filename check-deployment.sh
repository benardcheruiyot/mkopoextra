#!/usr/bin/env bash
echo "=== Check what backend is running ==="
ps aux | grep -i "backend\|cana" | grep -v grep | head -5

echo ""
echo "=== Check backend path ==="
pm2 info cana-backend | grep "script path"

echo ""
echo "=== Check if /var/www/talaextra exists ==="
ls -la /var/www/talaextra 2>&1 | head -10

echo ""
echo "=== Check what''s in /root/cana ==="
ls -la /root/cana 2>&1 | head -10

echo ""
echo "=== List current backend .env location ==="
cat /root/cana/backend/.env | head -3
