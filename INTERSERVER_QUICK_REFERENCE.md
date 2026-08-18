# 🚀 InterServer Deployment - Quick Reference

## 📋 Quick Checklist

- [ ] SSH into VPS: `ssh root@your_vps_ip`
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js, npm, Git, PM2, Nginx
- [ ] Clone repo: `git clone https://github.com/benardcheruiyot/mkopoextra.git`
- [ ] Setup backend `.env` file
- [ ] Install backend: `cd backend && npm install`
- [ ] Build frontend: `cd frontend && npm install && npm run build`
- [ ] Setup PM2: `pm2 start ecosystem.config.js`
- [ ] Setup Nginx config
- [ ] Setup SSL with Let's Encrypt
- [ ] Test: `https://your-domain.com`
- [ ] Update Daraja callback URL

---

## 🔑 Essential Commands

### Connect to VPS
```bash
ssh root@your_vps_ip_address
```

### Clone Code
```bash
cd ~
git clone https://github.com/benardcheruiyot/mkopoextra.git
cd mkopoextra
```

### Install Dependencies
```bash
# Backend
cd backend
npm install
cp .env.example .env
nano .env  # Edit with your values

# Frontend
cd ../frontend
npm install
npm run build
```

### Start Backend (PM2)
```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
```

### Check Status
```bash
pm2 status
pm2 logs lendhub-backend
sudo systemctl status nginx
```

---

## 📁 File Locations on VPS

```
/root/mkopoextra/
├── backend/
│   ├── .env              (CREATE THIS)
│   ├── ecosystem.config.js  (CREATE THIS)
│   ├── src/
│   └── package.json
│
├── frontend/
│   ├── build/           (Generated after npm run build)
│   ├── src/
│   └── package.json
│
└── INTERSERVER_DEPLOYMENT.md (This file!)
```

---

## 🌐 Nginx Config Location

```
/etc/nginx/sites-available/lendhub
/etc/nginx/sites-enabled/lendhub  (Symlink)
```

---

## 🔒 SSL Certificate Location

```
/etc/letsencrypt/live/your-domain.com/
├── fullchain.pem
├── privkey.pem
└── chain.pem
```

---

## 📊 Important Port Mappings

| Port | Service | Access |
|------|---------|--------|
| 80 | HTTP | Internet (Nginx) |
| 443 | HTTPS | Internet (Nginx) |
| 5000 | Node.js | Localhost only |
| 27017 | MongoDB | Localhost only |

---

## 🔄 Updating Code

When you push new code to GitHub:

```bash
# SSH into VPS
ssh root@your_vps_ip

# Go to project
cd ~/mkopoextra
git pull origin main

# If backend changed
cd backend
npm install
pm2 restart lendhub-backend

# If frontend changed
cd ../frontend
npm install
npm run build
sudo systemctl restart nginx
```

---

## 📝 Environment Variables Needed

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lendhub

PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=***
DARAJA_CONSUMER_SECRET=***
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://your-domain.com/api/payments/callback

JWT_SECRET=***
ALLOWED_ORIGINS=https://your-domain.com

VAPID_PUBLIC_KEY=***
VAPID_PRIVATE_KEY=***

APP_NAME=LendHub
APP_PUBLIC_URL=https://your-domain.com/api
```

---

## 🛠️ PM2 Management

```bash
# Start
pm2 start ecosystem.config.js

# Restart
pm2 restart lendhub-backend

# Stop
pm2 stop lendhub-backend

# Logs
pm2 logs lendhub-backend

# Monitor
pm2 monit

# Save state (auto-start on reboot)
pm2 save
pm2 startup
```

---

## 🔒 Nginx Management

```bash
# Test config
sudo nginx -t

# Start/Restart
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🧪 Testing

### Test Backend
```bash
curl https://your-domain.com/api
```

### Test Frontend
```
Open browser: https://your-domain.com
```

### View Logs
```bash
# Backend
pm2 logs lendhub-backend

# Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting

### Backend won't start?
```bash
pm2 logs lendhub-backend
# Check for errors, usually dependency or .env issue
```

### Nginx errors?
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### Payment not working?
```bash
pm2 logs lendhub-backend | grep -i daraja
# Check callback URL in Daraja account
```

### SSL certificate issues?
```bash
sudo certbot certificates
sudo certbot renew
```

---

## 📊 Monitoring Commands

```bash
# CPU/Memory usage
htop

# Disk space
df -h

# Process status
pm2 status

# Real-time monitor
pm2 monit

# System logs
sudo journalctl -xe
```

---

## 🔗 Important URLs

| Item | URL |
|------|-----|
| Frontend | https://your-domain.com |
| Backend API | https://your-domain.com/api |
| VPS Dashboard | https://vps.interserver.net |
| Daraja | https://developer.safaricom.co.ke |
| SSL Certs | https://letsencrypt.org |

---

## ⏱️ Setup Time Estimate

- SSH access & dependencies: 15 min
- Code clone & Node setup: 5 min
- Backend setup: 5 min
- Frontend build: 10 min
- Nginx config: 5 min
- SSL setup: 5 min
- Testing: 5 min
- **Total: ~50 minutes**

---

## ✅ Success Indicators

- ✅ `pm2 status` shows "online"
- ✅ `sudo systemctl status nginx` shows "active"
- ✅ `https://your-domain.com` loads frontend
- ✅ `https://your-domain.com/api` returns API response
- ✅ No errors in `pm2 logs` or `/var/log/nginx/error.log`
- ✅ SSL certificate valid (green lock in browser)

---

**Status:** ✅ Ready to deploy

**Next Step:** Follow [INTERSERVER_DEPLOYMENT.md](./INTERSERVER_DEPLOYMENT.md) step by step
