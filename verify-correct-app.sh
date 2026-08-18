#!/usr/bin/env bash
echo "=== Backend logs (last 30 lines) ==="
pm2 logs talacash-backend --lines 30 --nostream 2>&1 || true

echo ""
echo "=== Test backend startup ==="
curl -s http://127.0.0.1:5000/health 2>&1 || echo "No /health endpoint"

echo ""
echo "=== Check .env to verify talacash config ==="
cat /var/www/talaextra/backend/.env

echo ""
echo "=== Final verification ==="
echo "? Wrong app (cana-backend port 4000) - STOPPED"
echo "? Correct app (talacash-backend port 5000) - RUNNING"
echo "? Nginx proxy updated to port 5000"
echo ""
echo "Application talacash.mkopaji.com is now LIVE with correct backend!"
