#!/usr/bin/env bash
echo "=== Backend Log (last 50 lines) ==="
pm2 logs cana-backend --lines 50 --nostream 2>&1 || true

echo ""
echo "=== All Listening Ports ==="
ss -lntp 2>&1 | grep -E 'tcp|LISTEN'

echo ""
echo "=== Restart Backend ==="
pm2 restart cana-backend
sleep 3

echo ""
echo "=== Check Port 5000 Again ==="
ss -lntp 2>&1 | grep 5000 || echo "Still not listening on 5000"

echo ""
echo "=== Final HTTPS Test ==="
curl -s -w "\nHTTP Status: %{http_code}\n" -k https://talacash.mkopaji.com 2>&1 | head -20
