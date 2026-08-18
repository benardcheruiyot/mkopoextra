# Push Changes to Render - Step by Step

## ✅ Changes Made Locally

```env
HASHPAY_BASE_URL=https://api.hashback.co.ke  ← FIXED (was api.hashpay.co.ke)
MONGODB_URI=mongodb+srv://bcheruiyot221_db_user:3UAZ5oToTlyQVAML@cluster0.aqghn4v.mongodb.net/?appName=Cluster0  ← ADDED
```

---

## 🚀 Deploy to Render

### Option A: Update Render Dashboard (Recommended - 2 minutes)

1. **Go to:** https://dashboard.render.com
2. **Select** your backend service (lendhub-backend or similar)
3. **Click:** Environment (left sidebar)
4. **Find and update these variables:**

   ```
   HASHPAY_BASE_URL = https://api.hashback.co.ke
   ```

5. **Add (if not already there):**

   ```
   MONGODB_URI = mongodb+srv://bcheruiyot221_db_user:3UAZ5oToTlyQVAML@cluster0.aqghn4v.mongodb.net/?appName=Cluster0
   ```

6. **Click Save** → Render auto-redeploys (2-3 minutes)

7. **Test payment** → Should work now!

---

### Option B: Push via Git (Auto-deploy)

If Render is connected to your GitHub repo:

```powershell
# Terminal in your project root
git add backend/.env

# Only if .env is NOT in .gitignore (it should be!)
# To check: cat .gitignore | grep ".env"

# Commit
git commit -m "fix: update hashback api endpoint and mongodb uri"

# Push
git push origin main
```

**Render will auto-detect the change and redeploy** (takes 2-3 minutes)

---

## ✅ After Deployment

1. **Wait 2-3 minutes** for Render to redeploy
2. **Test payment:**
   - Go to: https://talaextramkopo.vercel.app
   - Try making a payment
   - Check if you still get the `getaddrinfo ENOTFOUND` error

3. **If still failing:**
   - Check Render logs: https://dashboard.render.com → select service → Logs
   - Look for: `[Hashpay] ✅ Hashpay configured` or errors

---

## ⚠️ Important Notes

- **Do NOT commit .env to git if it has secrets**
- Always set sensitive values in **Render Environment dashboard**
- After setting HASHPAY_BASE_URL in Render, the domain error should be fixed
- **Still missing:** The correct API endpoint paths (`/api/v1/auth/token`, `/api/v1/stk-push`, etc.)

---

## 🔴 Next Issue

Once domain resolves, you'll likely get a **404 error on API endpoints** because we haven't found the correct HashBack paths yet.

At that point, I'll need you to provide:
```
- Token endpoint: /___
- STK push endpoint: /___
- Status endpoint: /___
```

