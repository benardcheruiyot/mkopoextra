#!/usr/bin/env bash
echo "=== Recent Backend Logs (Last 100 lines) ==="
tail -100 /root/.pm2/logs/cana-backend-out-4.log

echo ""
echo "=== Backend Error Logs ==="
find /root/.pm2/logs -name "*backend*error*" -exec tail -50 {} \;

echo ""
echo "=== Direct Backend Test (127.0.0.1:4000) ==="
curl -v http://127.0.0.1:4000/ 2>&1 | head -50
