#!/usr/bin/env bash
echo "=== Prepare backend deployment to /var/www/talaextra ==="
mkdir -p /var/www/talaextra

echo ""
echo "=== Syncing backend code ==="
# Receive the backend from local (this will be done via scp from local terminal)
# For now, setup the directory structure
cd /var/www/talaextra
mkdir -p backend src
chmod -R 755 /var/www/talaextra

echo "Ready for backend sync at /var/www/talaextra"
ls -la /var/www/talaextra
