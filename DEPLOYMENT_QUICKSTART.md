# Quick Start: Deploy LendHub to New Repository

## 1️⃣ Create New GitHub Repository

```bash
# Go to https://github.com/new
# Create repository named: lendhub
# DO NOT initialize with README (we have one)
```

## 2️⃣ Push Code to New Repo

```powershell
# In PowerShell, navigate to project root
cd c:\Users\bcher\Desktop\talamkopo

# Initialize git (fresh start)
git init
git add .
git commit -m "Initial commit: LendHub - refactored from Tala Mkopo Extra"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/lendhub.git

# Set main branch and push
git branch -M main
git push -u origin main
```

## 3️⃣ Deploy Backend to Render

```bash
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your GitHub account
4. Choose "lendhub" repository
5. Configure:
   - Name: lendhub-backend
   - Environment: Node
   - Build: cd backend && npm install
   - Start: cd backend && npm start
   - Region: Singapore (or closest to your users)
6. Click "Create Web Service"
7. Add Environment Variables (see LENDHUB_MIGRATION_GUIDE.md)
8. Deploy!
```

## 4️⃣ Deploy Frontend to Vercel

```bash
1. Go to https://vercel.com/new
2. Import GitHub repo: lendhub
3. Configure:
   - Framework: React
   - Root Directory: ./frontend
   - Build Command: npm run build (default OK)
4. Environment Variables:
   - REACT_APP_API_URL: https://your-render-url.com/api
5. Click "Deploy"
```

## 5️⃣ Connect Render & Vercel URLs

After both are deployed:

1. **Copy Render backend URL** (format: `https://lendhub-xxxx.onrender.com`)
2. **Update Vercel environment:**
   - Project Settings → Environment Variables
   - Update `REACT_APP_API_URL`
   - Redeploy

3. **Update Render backend:**
   - Add `ALLOWED_ORIGINS=https://your-vercel-url.vercel.app`
   - Redeploy

## 6️⃣ Update Daraja Configuration

In your Daraja account (https://sandbox.safaricom.co.ke):

1. Update Callback URL: `https://your-render-backend-url/api/payments/callback`
2. Add Consumer Key to Render env var: `DARAJA_CONSUMER_KEY`
3. Add Consumer Secret to Render env var: `DARAJA_CONSUMER_SECRET`

## 7️⃣ Test Everything

```
✅ Frontend loads: https://lendhub.vercel.app
✅ API responds: https://your-render-url/api/health
✅ Login works
✅ Loan form submits
✅ Payment flow completes
✅ Notifications work
```

---

## 🚀 You're Done!

**LendHub is live!**

- Frontend: https://lendhub.vercel.app
- API: https://lendhub-backend-xxxx.onrender.com
- Repository: https://github.com/YOUR_USERNAME/lendhub

### Useful Commands for Future Updates

```bash
# Pull latest code
git pull origin main

# Make changes and push
git add .
git commit -m "your message"
git push origin main

# Render auto-redeploys on git push!
# Vercel auto-redeploys on git push!
```

---

**Reference:** Full setup guide in [LENDHUB_MIGRATION_GUIDE.md](./LENDHUB_MIGRATION_GUIDE.md)
