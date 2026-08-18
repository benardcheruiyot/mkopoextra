#!/usr/bin/env bash
echo "=== Nginx Error Log (last 50 lines) ==="
tail -50 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"

echo ""
echo "=== List nginx config ==="
ls -la /etc/nginx/conf.d/

echo ""
echo "=== Nginx talacash config ==="
cat /etc/nginx/conf.d/talacash.conf

echo ""
echo "=== Test if root directory works ==="
ls -la /var/www/talaextra/frontend/build 2>&1 | head -5 || echo "Build dir missing"
