# 🚀 LendHub Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Code Preparation
- [ ] Clone repo locally or pull latest changes
- [ ] Review all environment variable templates
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Add your secrets to `.env` (don't commit!)

### 2. Daraja Setup (Optional - if using Daraja)
- [ ] Get Daraja Consumer Key from dashboard
- [ ] Get Daraja Consumer Secret from dashboard
- [ ] Add to `.env`: `DARAJA_CONSUMER_KEY=xxx`
- [ ] Add to `.env`: `DARAJA_CONSUMER_SECRET=xxx`
- [ ] Verify Business Shortcode: `5416814` is correct
- [ ] Create/update `backend/src/services/darajaService.js` (use template from `DARAJA_INTEGRATION.md`)
- [ ] Register in `backend/src/services/paymentService.js`

### 3. Database Setup
- [ ] Create MongoDB Atlas cluster (or other provider)
- [ ] Get connection string
- [ ] Add to `.env`: `MONGODB_URI=mongodb+srv://...`

### 4. Push Notifications (Optional but Recommended)
- [ ] Generate VAPID keys (use web-push CLI)
- [ ] Add to `.env`: `VAPID_PUBLIC_KEY=xxx`
- [ ] Add to `.env`: `VAPID_PRIVATE_KEY=xxx`
- [ ] Set subject email: `VAPID_SUBJECT=mailto:your-email@lendhub.com`

### 5. Local Testing
```bash
# Test backend
cd backend
npm install
npm run dev

# In another terminal, test frontend
cd frontend
npm install
npm start

# Test payment flow
# Go to http://localhost:3000 and apply for loan
```

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:5000/api
- [ ] Can register/login
- [ ] Can apply for loan
- [ ] Payment initiation works

---

## 🌐 GitHub Repository Setup

### 6. Create New Repository
```bash
cd /path/to/lendhub
rm -rf .git  # Remove old history if needed
git init
git add .
git commit -m "Initial commit: LendHub - M-Pesa loan application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lendhub.git
git push -u origin main
```

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] `.env` file is in `.gitignore` (don't commit secrets!)
- [ ] All files pushed except `.env`

---

## ☁️ Render Backend Deployment

### 7. Create Render Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub account
4. Select `lendhub` repository

### 8. Configure Render Service
- Name: `lendhub-backend`
- Environment: `Node`
- Region: `Singapore` (or closest to your users)
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Click "Create Web Service"

### 9. Add Render Environment Variables
In Render Dashboard → Environment:

**Non-secret variables:**
```
NODE_ENV=production
PORT=10000
PAYMENT_PROVIDER=daraja
ALLOWED_ORIGINS=https://lendhub.vercel.app,https://www.lendhub.vercel.app
FRONTEND_URL=https://lendhub.vercel.app
APP_PUBLIC_URL=https://your-render-url.render.com
APP_NAME=LendHub
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
LOAN_INTEREST_RATE=0.1
LOAN_TERMS_DAYS=30,60,90
PROCESSING_FEE=120
```

**Secret variables (from your `.env`):**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DARAJA_CONSUMER_KEY=your_daraja_consumer_key
DARAJA_CONSUMER_SECRET=your_daraja_consumer_secret
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://your-render-backend-url/api/payments/callback
DARAJA_ENVIRONMENT=production
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@lendhub.com
```

- [ ] All environment variables added
- [ ] Render service is building (should take 2-5 minutes)
- [ ] Backend URL visible: `https://lendhub-xxxx.onrender.com`

### 10. Verify Backend Deployment
- [ ] Backend deploys successfully
- [ ] No errors in Render logs
- [ ] Visit `https://your-render-url/api/health` (if endpoint exists)

---

## 🎨 Vercel Frontend Deployment

### 11. Create Vercel Project
1. Go to https://vercel.com/new
2. Import your GitHub repo (`lendhub`)
3. Select your GitHub account

### 12. Configure Vercel Project
- Framework: React
- Root Directory: `frontend`
- Build Command: `npm run build` (default OK)
- Install Command: `npm install` (default OK)

### 13. Add Vercel Environment Variable
- Key: `REACT_APP_API_URL`
- Value: `https://your-render-backend-url/api`

Example: `https://lendhub-abc123.onrender.com/api`

### 14. Deploy
- Click "Deploy"
- Wait for deployment to complete (2-3 minutes)
- Frontend URL: `https://lendhub.vercel.app` (or your custom domain)

- [ ] Frontend deploys successfully
- [ ] No errors in Vercel dashboard
- [ ] Can access frontend at deployment URL

---

## 🔗 Post-Deployment Configuration

### 15. Update Render Backend with Real Frontend URL
After Vercel deployment, update Render:

1. Go to Render Dashboard → lendhub-backend → Environment
2. Update: `APP_PUBLIC_URL` with actual Vercel URL
3. Update: `DARAJA_CALLBACK_URL` with actual Render URL
4. Update: `ALLOWED_ORIGINS` with actual Vercel URL (if different)
5. Click "Save" → Render will redeploy

### 16. Update Daraja Configuration
1. Go to https://developer.safaricom.co.ke
2. Login to your app/account
3. Update Callback URLs:
   - Confirmation: `https://your-render-backend-url/api/payments/callback`
   - Validation: `https://your-render-backend-url/api/payments/validate`
4. Save settings

- [ ] Render backend redeployed with correct URLs
- [ ] Daraja account updated with new callback URLs

---

## ✨ Final Testing (Production)

### 17. Test Production Deployment
- [ ] Frontend loads: `https://lendhub.vercel.app`
- [ ] Can register/login
- [ ] Can apply for loan
- [ ] Payment flow works end-to-end
- [ ] Receive payment callback in backend
- [ ] Loan status updates after payment

### 18. Monitor Logs
- Render: https://dashboard.render.com → Logs
- Vercel: https://vercel.com/dashboard → Deployments → View Logs

- [ ] No errors in backend logs
- [ ] No errors in frontend console
- [ ] Payment callbacks received successfully

---

## 📝 Documentation & Sharing

### 19. Create Deployment Document
Share with team/client:

```markdown
# 🎉 LendHub - Live Deployment

## URLs
- **Frontend**: https://lendhub.vercel.app
- **Backend API**: https://your-render-url.onrender.com
- **GitHub**: https://github.com/YOUR_USERNAME/lendhub

## Features
- ✅ User Authentication (Phone-based)
- ✅ Loan Application
- ✅ M-Pesa Payment Processing (Daraja API)
- ✅ Push Notifications
- ✅ Real-time Payment Status

## Payment Processing
- Business Shortcode: 5416814
- Payment Provider: Daraja M-Pesa
- Callback URL: https://your-render-url.onrender.com/api/payments/callback

## Support
- [Daraja Documentation](https://developer.safaricom.co.ke/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
```

- [ ] Create deployment document
- [ ] Share URLs with team
- [ ] Document any custom configurations

---

## 🔒 Security Checklist (Before Going Live)

- [ ] Never commit `.env` file to GitHub
- [ ] All secrets are in Render/Vercel dashboards only
- [ ] CORS is properly configured (only allow lendhub.vercel.app)
- [ ] JWT_SECRET is a strong random string
- [ ] HTTPS is enabled (Render & Vercel provide by default)
- [ ] Daraja callback URL is whitelisted in Daraja account
- [ ] Database connection is secure (MongoDB Atlas IP whitelist)
- [ ] No test/dummy data in production database

---

## 📊 Performance & Monitoring

### 20. Setup Monitoring (Optional)
- [ ] Enable Render error tracking
- [ ] Enable Vercel analytics
- [ ] Monitor database performance
- [ ] Set up alerts for errors

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors  
✅ Can create user account  
✅ Can apply for loan  
✅ Payment flow initiates STK push  
✅ M-Pesa prompt appears on phone  
✅ After payment, callback received  
✅ Loan status updates to "Approved"  
✅ Can view loan in dashboard  
✅ No errors in backend logs  

---

## 💾 Future Updates

To deploy future changes:

```bash
# Make changes locally
git add .
git commit -m "fix: update payment flow"

# Push to GitHub
git push origin main

# Render & Vercel auto-redeploy on git push!
# Monitor deployment in dashboards
```

---

## 📞 Quick Reference

| Component | URL | Dashboard |
|-----------|-----|-----------|
| Frontend | https://lendhub.vercel.app | https://vercel.com |
| Backend | https://your-render-url | https://render.com |
| Database | MongoDB Atlas | https://cloud.mongodb.com |
| Git Repo | GitHub | https://github.com |
| Payment API | Daraja | https://developer.safaricom.co.ke |

---

**Ready to launch! 🚀 Once complete, share the Frontend & Backend URLs.**
