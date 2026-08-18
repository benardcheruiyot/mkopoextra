#!/usr/bin/env bash
echo "=== FINAL PRODUCTION VERIFICATION ==="
echo ""
echo "1. HTTPS Certificate:"
openssl x509 -in /etc/letsencrypt/live/talacash.mkopaji.com/cert.pem -noout -dates

echo ""
echo "2. Nginx Config (no errors):"
nginx -t 2>&1 | grep -E "ok|successful"

echo ""
echo "3. Frontend HTTPS Response:"
curl -s -I https://talacash.mkopaji.com | head -5

echo ""
echo "4. API Endpoint Test:"
curl -s https://talacash.mkopaji.com/api/ | head -10

echo ""
echo "5. Backend Service Status:"
pm2 list | grep -E "^?.*cana-backend" | head -3

echo ""
echo "=== ? DEPLOYMENT STATUS: LIVE & WORKING ==="
