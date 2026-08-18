#!/usr/bin/env bash
echo "=== Check if frontend build exists ==="
ls -la /var/www/talaextra/frontend/build 2>&1 | head -10 || echo "Frontend build not found in expected location"

echo ""
echo "=== Check backend status on port 4000 ==="
curl -s http://127.0.0.1:4000/health || curl -s http://127.0.0.1:4000/ || echo "No response from backend health"

echo ""
echo "=== Test HTTPS with verbose output ==="
curl -v -k https://talacash.mkopaji.com 2>&1 | head -40

echo ""
echo "=== List /root/cana directory ==="
ls -la /root/cana/frontend/build 2>&1 | head -10 || echo "Frontend build also not in /root/cana"
