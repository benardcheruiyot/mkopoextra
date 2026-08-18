# LendHub - App Refactoring & Deployment Guide

## ✅ Migration Complete!

Your codebase has been successfully refactored from **Tala Mkopo Extra** to **LendHub** with zero conflicts. All changes follow best practices for code reuse.

---

## 📋 What Was Changed

### 1. **Branding & App Names**
- ✅ All UI text: "Tala Mkopo Extra" → "LendHub"
- ✅ Package names: "loan-app-backend" → "lendhub-backend"
- ✅ Package names: "loan-app-frontend" → "lendhub-frontend"
- ✅ Page titles and headers updated
- ✅ Email: "support@talamkopoextra.com" → "support@lendhub.com"
- ✅ Logo initials: "T" → "L"

### 2. **Backend URLs & Configuration**
- ✅ Backend service name: "talaextra-backend" → "lendhub-backend"
- ✅ Render callback URL: "https://talaextraa.onrender.com" → "https://api.lendhub.render.com"
- ✅ Updated `.env.example` with new URLs
- ✅ Updated `render.yaml` with new service configuration
- ✅ Removed old JWT fallback variables (TALA_EXTRA_JWT_FALLBACK)

### 3. **Frontend URLs & Configuration**
- ✅ API base URL: "https://talaextraa.onrender.com/api" → "https://api.lendhub.render.com/api"
- ✅ Vercel proxy route updated
- ✅ Frontend domain: "talaextramkopo.vercel.app" → "lendhub.vercel.app"
- ✅ CORS origins updated in all config files

### 4. **Documentation**
- ✅ Updated README.md files for both backend and frontend
- ✅ Updated RENDER_SETUP.md with new service names
- ✅ Updated PUSH_TO_RENDER.md
- ✅ Updated HASHBACK_ENDPOINTS.md
- ✅ Updated HASHPAY_SETUP.md
- ✅ Updated MPESA_AUTH_FIX.md

### 5. **Push Notifications**
- ✅ App name in notifications: "Tala Mkopo" → "LendHub"

---

## 🚀 Next Steps: Deployment

### Step 1: Update Your Secrets & Environment Variables

**DO NOT commit secrets to the repository!**

Create a new `.env` file in `backend/` with your Daraja API credentials:

```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://lendhub.vercel.app,https://www.lendhub.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=your_daraja_consumer_key
DARAJA_CONSUMER_SECRET=your_daraja_consumer_secret
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
DARAJA_ENVIRONMENT=production
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@lendhub.com
APP_NAME=LendHub
APP_PUBLIC_URL=https://api.lendhub.render.com
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
LOAN_INTEREST_RATE=0.1
LOAN_TERMS_DAYS=30,60,90
PROCESSING_FEE=120
```

### Step 2: Create New Git Repository

```bash
# Remove old git history (if reusing directory)
rm -rf .git

# Initialize new repo
git init

# Add new remote
git remote add origin https://github.com/your-username/lendhub.git

# Create initial commit
git add .
git commit -m "Initial commit: LendHub refactored from Tala Mkopo Extra"

# Push to new repo
git branch -M main
git push -u origin main
```

### Step 3: Deploy Backend to Render

1. **Create new Render service:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Service name: `lendhub-backend`
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`

2. **Add Environment Variables** in Render Dashboard:
   - Copy all values from your `.env` file
   - Add each variable in the Environment section
   - **DO NOT use .env file directly** - Render loads from dashboard variables only

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)
   - Note your service URL (format: `https://lendhub-backend-xxxx.onrender.com`)

### Step 4: Deploy Frontend to Vercel

1. **Create new Vercel project:**
   - Go to https://vercel.com/new
   - Import your GitHub repo
   - Framework: React
   - Root directory: `frontend/`

2. **Set Environment Variables:**
   - Add `REACT_APP_API_URL=https://api.lendhub.render.com/api`

3. **Deploy:**
   - Click "Deploy"
   - Your frontend URL will be `https://lendhub.vercel.app` (or custom domain)

### Step 5: Update CORS & Callbacks

After deployment, update your backend `.env` with actual URLs:

```env
# Update after deployment
ALLOWED_ORIGINS=https://lendhub.vercel.app,https://www.lendhub.vercel.app
APP_PUBLIC_URL=https://your-actual-render-url.com
DARAJA_CALLBACK_URL=https://your-actual-render-url.com/api/payments/callback
```

Then redeploy the backend on Render.

---

## 🔐 Security Checklist

- [ ] Never commit `.env` file to repository
- [ ] Add `.env` to `.gitignore` (it should be already)
- [ ] Use Render/Vercel dashboard for secrets, not git
- [ ] Rotate JWT_SECRET if this was public
- [ ] Update Daraja API credentials (if using new account)
- [ ] Verify CORS origins match your actual frontend URL
- [ ] Test payment callbacks in staging before production

---

## 📝 Daraja API Configuration

For M-Pesa payments, update your Daraja account:

1. **Log in to** https://sandbox.safaricom.co.ke or production
2. **Update Callback URLs:**
   - Confirmation: `https://api.lendhub.render.com/api/payments/callback`
   - Validation: `https://api.lendhub.render.com/api/payments/validate`

3. **Get Credentials:**
   - Consumer Key (copy to `DARAJA_CONSUMER_KEY`)
   - Consumer Secret (copy to `DARAJA_CONSUMER_SECRET`)

4. **Business Configuration:**
   - Business Shortcode / Till Number: `5416814` (set as `DARAJA_BUSINESS_SHORTCODE`)
   - This is your M-Pesa till or business number used for transactions

---

## 🧪 Testing

### Local Testing
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

### Testing Payment Flow
1. Open http://localhost:3000
2. Go to Loan page
3. Initiate payment
4. Use Daraja sandbox credentials
5. Verify callback is received at backend

### Testing Push Notifications
1. Subscribe to notifications in browser
2. Send test notification from backend
3. Verify notification appears

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template for backend env vars |
| `backend/package.json` | Backend dependencies (now lendhub-backend) |
| `frontend/package.json` | Frontend dependencies (now lendhub-frontend) |
| `render.yaml` | Render deployment config |
| `frontend/vercel.json` | Vercel deployment config |
| `RENDER_SETUP.md` | Render dashboard setup guide |
| `PUSH_TO_RENDER.md` | Instructions to push code to Render |

---

## 🆘 Troubleshooting

### Payment callbacks not working?
- Verify `DARAJA_CALLBACK_URL` is correct in Render dashboard
- Check that URL is whitelisted in Daraja account
- Review backend logs in Render dashboard

### CORS errors?
- Update `ALLOWED_ORIGINS` to match your exact frontend URL
- Include both `https://lendhub.vercel.app` and `https://www.lendhub.vercel.app`
- Redeploy backend after updating

### Frontend can't connect to backend?
- Verify `REACT_APP_API_URL` is set in Vercel
- Check that API URL is not hardcoded anywhere (should use env var)
- Clear browser cache and restart dev server

---

## ✨ Best Practices Maintained

✅ **Clean separation of concerns** - Frontend and backend can be deployed independently  
✅ **Environment-based configuration** - Use env vars for URLs, never hardcode  
✅ **No secrets in code** - All credentials in .env/dashboard  
✅ **CORS properly configured** - Only allow trusted origins  
✅ **Consistent branding** - Updated everywhere systematically  
✅ **Documentation updated** - All setup guides reflect new URLs  
✅ **Callback URLs valid** - Match actual deployment URLs  

---

## 📞 Support

For payment API issues, consult:
- [Daraja API Documentation](https://developer.safaricom.co.ke/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Happy coding! 🚀**  
Your LendHub app is ready for deployment.
