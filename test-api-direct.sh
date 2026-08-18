#!/usr/bin/env bash
echo "=== Test API endpoint directly ==="
curl -s http://127.0.0.1:4000/api/ | head -20

echo ""
echo "=== Test root with verbose ==="
curl -v http://127.0.0.1:4000/ 2>&1 | grep -E "^<|^HTTP|^Content|^Server" | head -20

echo ""
echo "=== Check nginx access logs ==="
tail -20 /var/log/nginx/access.log 2>/dev/null || echo "No nginx access log"

echo ""
echo "=== Check if backend config needs fixing ==="
grep -r "APP_DOMAIN\|NODE_ENV\|PORT" /root/cana/backend/.env | head -10
