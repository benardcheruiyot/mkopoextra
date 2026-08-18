# 🚀 LendHub Quick Reference Card

## Key Information

| Item | Value |
|------|-------|
| **App Name** | LendHub |
| **Backend Package** | lendhub-backend |
| **Frontend Package** | lendhub-frontend |
| **Payment Provider** | Daraja M-Pesa |
| **Business Shortcode** | 5416814 |
| **Loan Min** | 5,500 KES |
| **Loan Max** | 150,000 KES |
| **Processing Fee** | 120 KES |

---

## URLs (After Deployment)

```
Frontend:  https://lendhub.vercel.app
Backend:   https://[your-service].onrender.com
GitHub:    https://github.com/YOUR_USERNAME/lendhub
```

---

## Environment Variables (`.env`)

### Required
```
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=xxx
DARAJA_CONSUMER_SECRET=xxx
DARAJA_BUSINESS_SHORTCODE=5416814
MONGODB_URI=xxx
JWT_SECRET=xxx
```

### Optional but Recommended
```
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
DARAJA_ENVIRONMENT=production
```

---

## Deployment Commands

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Git Push
```bash
git add .
git commit -m "Initial: LendHub"
git branch -M main
git remote add origin https://github.com/YOU/lendhub.git
git push -u origin main
```

### Deploy Backend (Render)
```
1. https://dashboard.render.com
2. "New +" → "Web Service"
3. Select lendhub repo
4. Name: lendhub-backend
5. Add env vars from .env
6. Deploy!
```

### Deploy Frontend (Vercel)
```
1. https://vercel.com/new
2. Import lendhub repo
3. Root: ./frontend
4. Env: REACT_APP_API_URL=[backend-url]/api
5. Deploy!
```

---

## Testing Checklist

- [ ] Frontend loads
- [ ] Can register
- [ ] Can login
- [ ] Can apply for loan
- [ ] Payment initiates
- [ ] STK prompt appears
- [ ] Callback received
- [ ] Loan approved
- [ ] No console errors
- [ ] No server errors

---

## Important Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment template |
| `backend/src/services/darajaService.js` | **CREATE THIS** |
| `backend/src/services/paymentService.js` | Update provider list |
| `render.yaml` | Render deployment config |
| `DEPLOYMENT_CHECKLIST.md` | **Follow this first** |
| `DARAJA_INTEGRATION.md` | Code templates |

---

## Before Going Live

- [ ] Consumer Key from Daraja
- [ ] Consumer Secret from Daraja
- [ ] MongoDB connection string
- [ ] Strong JWT_SECRET
- [ ] Verify CORS settings
- [ ] Update Daraja callback URLs

---

## Daraja Callback URL

```
https://[your-render-service].onrender.com/api/payments/callback
```

Update this in Daraja Dashboard after deployment!

---

## API Endpoints

| Endpoint | Method | Auth |
|----------|--------|------|
| `/auth/register` | POST | No |
| `/user/profile` | GET | Yes |
| `/loans/apply` | POST | Yes |
| `/payments/initiate` | POST | Yes |
| `/payments/status` | GET | Yes |
| `/payments/callback` | POST | No |

---

## Quick Troubleshooting

**Frontend can't reach backend?**
- Check `REACT_APP_API_URL` in Vercel
- Check CORS in Render (ALLOWED_ORIGINS)

**Payment not working?**
- Verify Daraja Consumer Key/Secret
- Check callback URL in Daraja account
- Verify business shortcode: 5416814

**Database connection fails?**
- Verify MONGODB_URI is correct
- Check MongoDB IP whitelist (add 0.0.0.0)

---

## Documentation Map

```
START HERE →
   ↓
LENDHUB_SUMMARY.md (overview)
   ↓
DEPLOYMENT_CHECKLIST.md (step-by-step)
   ↓
DARAJA_SETUP.md (if using Daraja)
   ↓
DARAJA_INTEGRATION.md (if creating darajaService.js)
   ↓
LENDHUB_MIGRATION_GUIDE.md (detailed reference)
```

---

## Render Environment Variables

```
NODE_ENV=production
PORT=10000
PAYMENT_PROVIDER=daraja
ALLOWED_ORIGINS=https://lendhub.vercel.app,https://www.lendhub.vercel.app
FRONTEND_URL=https://lendhub.vercel.app
APP_PUBLIC_URL=https://[your-url].onrender.com
APP_NAME=LendHub

# ADD FROM YOUR .env:
MONGODB_URI
JWT_SECRET
DARAJA_CONSUMER_KEY
DARAJA_CONSUMER_SECRET
DARAJA_BUSINESS_SHORTCODE
DARAJA_CALLBACK_URL
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

---

## Vercel Environment Variables

```
REACT_APP_API_URL=https://[your-render-url]/api
```

---

## Post-Deployment

1. Update Render → APP_PUBLIC_URL (actual URL)
2. Update Daraja → Callback URLs
3. Test payment flow
4. Monitor logs
5. Share URLs

---

## Emergency Commands

**Restart backend:**
```bash
# In Render Dashboard → Logs → Restart Deploy
```

**View logs:**
```bash
# Render: Dashboard → Logs
# Vercel: Dashboard → Deployments → Logs
```

**Rollback:**
```bash
git revert [commit-hash]
git push origin main
# Services auto-redeploy
```

---

## Payment Flow Diagram

```
User App
   ↓ (Apply for Loan)
Backend API
   ↓ (Initiate Payment)
Daraja M-Pesa API
   ↓ (STK Push)
User Phone
   ↓ (Enter PIN)
M-Pesa
   ↓ (Callback)
Backend API
   ↓ (Update Status)
Database
   ↓ (Update Loan)
Frontend
   ↓ (Show Approved)
User Dashboard
```

---

## Support Links

- [Daraja Docs](https://developer.safaricom.co.ke/docs/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Docs](https://docs.mongodb.com/)

---

## Final Checklist Before Sharing URLs

- [ ] Both services deployed
- [ ] No errors in logs
- [ ] Payment flow tested
- [ ] Daraja callback URL updated
- [ ] All environment variables set
- [ ] Frontend loads with no 404s
- [ ] Backend responds to API calls
- [ ] User can complete full flow

---

**Time Estimate:** 
- Setup: 15 min
- Deployment: 20 min
- Testing: 15 min
- **Total: ~50 minutes**

---

**Status: ✅ READY FOR DEPLOYMENT**

Next step: Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
