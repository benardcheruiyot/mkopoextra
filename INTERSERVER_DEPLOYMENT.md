# 🚀 LendHub Deployment Guide - InterServer VPS

Complete guide to deploy LendHub (backend + frontend) on InterServer VPS.

---

## 📋 Prerequisites

- ✅ InterServer VPS account (you have this)
- ✅ Root/SSH access to your VPS
- ✅ Domain name pointing to your VPS (optional, or use IP)
- ✅ Code pushed to GitHub (✅ Already done)

---

## 🔧 Step 1: Connect to Your InterServer VPS

### Using PowerShell/Terminal

```powershell
# SSH into your VPS
ssh root@your_vps_ip_address

# Example:
# ssh root@192.168.1.100

# When prompted, enter your InterServer VPS password
```

### Using InterServer Control Panel

1. Log in to https://vps.interserver.net
2. Select your VPS instance
3. Click "Web Terminal" or "SSH Access"
4. Get your VPS IP address and SSH credentials

---

## 📦 Step 2: Update System & Install Dependencies

Once connected via SSH:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS - recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install npm (comes with Node.js)
npm --version

# Install Git
sudo apt install -y git

# Install PM2 (process manager - keeps apps running)
sudo npm install -g pm2

# Install MongoDB (if you want database on same server)
# OR skip if using MongoDB Atlas (cloud)
sudo apt install -y mongodb

# Install Nginx (web server + reverse proxy)
sudo apt install -y nginx

# Verify installations
node --version
npm --version
pm2 --version
```

---

## 🗂️ Step 3: Clone Your GitHub Repository

```bash
# Go to home directory
cd ~

# Clone your repo
git clone https://github.com/benardcheruiyot/mkopoextra.git
cd mkopoextra

# Verify
ls -la
```

---

## ⚙️ Step 4: Setup Backend (Node.js)

### Install Backend Dependencies

```bash
cd backend

# Install npm packages
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env

# Press Ctrl+X, then Y, then Enter to save
```

### Edit .env File

```env
# Essential variables
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lendhub

# OR if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/lendhub

# Daraja Configuration
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=your_daraja_key
DARAJA_CONSUMER_SECRET=your_daraja_secret
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://your-domain.com/api/payments/callback
DARAJA_ENVIRONMENT=production

# JWT
JWT_SECRET=your_very_long_random_secret_string_here

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@lendhub.com

# App Settings
APP_NAME=LendHub
APP_PUBLIC_URL=https://your-domain.com/api
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
PROCESSING_FEE=120
```

### Test Backend Locally

```bash
# While still in backend directory
npm run dev

# You should see:
# 🚀 BACKEND STARTUP - ...
# Server running on http://localhost:5000
```

Press `Ctrl+C` to stop, then continue:

```bash
cd ../..  # Go back to project root
```

---

## 🎨 Step 5: Setup Frontend (React)

### Build Frontend for Production

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'build' folder with optimized files
# You should see: "Compiled successfully!"

cd ../..  # Go back to root
```

---

## 🚀 Step 6: Setup PM2 (Process Manager)

PM2 keeps your Node.js app running and auto-restarts on crash.

### Create PM2 Configuration

```bash
# Go to backend directory
cd backend

# Create ecosystem.config.js file
nano ecosystem.config.js
```

Paste this content:

```javascript
module.exports = {
  apps: [{
    name: 'lendhub-backend',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Save: `Ctrl+X`, `Y`, `Enter`

### Start Backend with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the app
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs lendhub-backend

# Save PM2 config to auto-start on reboot
pm2 startup
pm2 save

# You should see:
# [PM2] Done. +3 new processes
```

---

## 🌐 Step 7: Setup Nginx (Reverse Proxy)

Nginx routes traffic to your Node.js backend and serves static frontend files.

### Create Nginx Config

```bash
# Go to nginx config directory
cd /etc/nginx/sites-available

# Create config file for your domain
sudo nano lendhub

# If using just IP (no domain), name it: lendhub-ip
```

Paste this (replace `your-domain.com` with your actual domain or IP):

```nginx
# Upstream backend server
upstream backend {
    server localhost:5000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (setup with Let's Encrypt next)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Serve frontend static files
    location / {
        root /root/mkopoextra/frontend/build;
        try_files $uri /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save: `Ctrl+X`, `Y`, `Enter`

### Enable Nginx Config

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/lendhub /etc/nginx/sites-enabled/lendhub

# Test Nginx config
sudo nginx -t

# Should show: "test is successful"

# Start/restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# Enable auto-start on reboot
sudo systemctl enable nginx
```

---

## 🔒 Step 8: Setup HTTPS with Let's Encrypt (FREE SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email
# - Accept terms
# - Enter domain when asked

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo certbot renew --dry-run
```

---

## 📊 Step 9: Setup MongoDB (if storing on same server)

Skip this if using **MongoDB Atlas** (cloud).

```bash
# Start MongoDB service
sudo systemctl start mongodb

# Enable auto-start on reboot
sudo systemctl enable mongodb

# Create database and user
mongo

# In MongoDB shell:
use lendhub
db.createUser({
  user: "lendhub_user",
  pwd: "your_secure_password",
  roles: [{role: "dbOwner", db: "lendhub"}]
})

exit

# Update backend .env:
# MONGODB_URI=mongodb://lendhub_user:your_secure_password@localhost:27017/lendhub
```

---

## 🔄 Step 10: Update Daraja Callback URL

In your Daraja account (https://developer.safaricom.co.ke):

1. Go to your app settings
2. Update Callback URLs:
   ```
   Confirmation: https://your-domain.com/api/payments/callback
   Validation: https://your-domain.com/api/payments/validate
   ```

3. Save settings

---

## ✅ Step 11: Verify Everything is Working

### Test Backend API

```bash
# From your local machine
curl https://your-domain.com/api

# Or in browser:
# https://your-domain.com/api/user/profile (if logged in)
```

### Test Frontend

```bash
# In browser:
# https://your-domain.com

# Should load the LendHub app
```

### Check Logs

```bash
# View backend logs
pm2 logs lendhub-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs (if local)
sudo tail -f /var/log/mongodb/mongod.log
```

---

## 🛠️ Useful Commands for Management

### Backend Management (PM2)

```bash
# Start backend
pm2 start ecosystem.config.js

# Stop backend
pm2 stop lendhub-backend

# Restart backend
pm2 restart lendhub-backend

# Delete from PM2
pm2 delete lendhub-backend

# View logs
pm2 logs lendhub-backend

# View monit (real-time monitoring)
pm2 monit

# List all PM2 apps
pm2 list

# Save PM2 state (auto-start on reboot)
pm2 save
pm2 startup
```

### Nginx Management

```bash
# Check config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# View status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Git Updates

When you push new code to GitHub:

```bash
# Pull latest code
cd ~/mkopoextra
git pull origin main

# If backend changed, rebuild
cd backend
npm install
pm2 restart lendhub-backend

# If frontend changed, rebuild and copy
cd ../frontend
npm install
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📝 Environment Variables Summary

Create `.env` in `backend/` with:

```env
# Server
NODE_ENV=production
PORT=5000

# Database (choose one)
MONGODB_URI=mongodb://localhost:27017/lendhub
# OR
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lendhub

# Daraja
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=from_daraja_dashboard
DARAJA_CONSUMER_SECRET=from_daraja_dashboard
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://your-domain.com/api/payments/callback
DARAJA_ENVIRONMENT=production

# JWT
JWT_SECRET=your_long_random_secure_string

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# App
APP_NAME=LendHub
APP_PUBLIC_URL=https://your-domain.com/api

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@lendhub.com

# Loans
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
LOAN_INTEREST_RATE=0.1
LOAN_TERMS_DAYS=30,60,90
PROCESSING_FEE=120
```

---

## 🔒 Security Checklist

- [ ] `.env` file is NOT committed to Git
- [ ] SSH key configured (use key-based auth, not password)
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Strong JWT_SECRET (use: `openssl rand -base64 32`)
- [ ] MongoDB user created with strong password
- [ ] Regular backups configured
- [ ] Daraja callback URL whitelisted
- [ ] CORS limited to your domain only

---

## 🚨 Troubleshooting

### Backend not starting?
```bash
# Check logs
pm2 logs lendhub-backend

# Check .env file
cat backend/.env

# Test Node.js
node --version

# Reinstall dependencies
cd backend
npm install
pm2 restart lendhub-backend
```

### Frontend showing blank page?
```bash
# Rebuild frontend
cd frontend
npm run build

# Check if build folder exists
ls -la build/

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Payment not working?
```bash
# Check backend logs for Daraja errors
pm2 logs lendhub-backend | grep -i daraja

# Verify callback URL in .env
grep DARAJA_CALLBACK_URL backend/.env

# Verify URL is whitelisted in Daraja account
```

### SSL certificate issues?
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx config
sudo nginx -t
```

---

## 📊 Monitoring & Maintenance

### Monitor Backend Performance
```bash
pm2 monit
```

### View System Resources
```bash
# CPU, Memory, Disk usage
htop

# Disk space
df -h

# MongoDB stats (if using local)
mongo --eval "db.stats()"
```

### Regular Maintenance
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clean up
sudo apt autoremove

# Backup database
mongodump --out /backup/mongodb

# Check logs for errors
sudo journalctl -xe
```

---

## 🎯 Final URLs

After deployment:

```
Frontend: https://your-domain.com
Backend: https://your-domain.com/api
API Calls: https://your-domain.com/api/...
```

---

## 📞 Useful InterServer Resources

- InterServer VPS Dashboard: https://vps.interserver.net
- InterServer Support: https://www.interserver.net/contact/
- VPS Docs: https://www.interserver.net/vps/

---

## ✅ Deployment Complete!

Your LendHub app is now running on InterServer VPS with:
- ✅ Node.js backend (PM2 managed)
- ✅ React frontend (Nginx served)
- ✅ HTTPS/SSL (Let's Encrypt)
- ✅ Auto-restart on crashes
- ✅ Auto-start on reboot
- ✅ Production-grade setup

**Congratulations! 🚀**
