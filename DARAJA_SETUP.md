# Daraja M-Pesa API Configuration Guide

## 🔧 Quick Setup

Your LendHub app is configured to use **Daraja M-Pesa API** for payment processing.

### Key Configuration Values

| Variable | Value | Where to Set |
|----------|-------|--------------|
| **PAYMENT_PROVIDER** | `daraja` | `.env` or Render Dashboard |
| **DARAJA_CONSUMER_KEY** | Your Daraja Consumer Key | `.env` or Render Dashboard |
| **DARAJA_CONSUMER_SECRET** | Your Daraja Consumer Secret | `.env` or Render Dashboard |
| **DARAJA_BUSINESS_SHORTCODE** | `5416814` | `.env` or Render Dashboard |
| **DARAJA_CALLBACK_URL** | `https://api.lendhub.render.com/api/payments/callback` | `.env` or Render Dashboard |

---

## 📋 Setup Instructions

### Step 1: Get Daraja Credentials

1. Go to **https://developer.safaricom.co.ke**
2. Sign in or create an account
3. Create a new app
4. Copy your **Consumer Key** and **Consumer Secret**

### Step 2: Configure Locally (.env)

Create/update `backend/.env`:

```env
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=your_consumer_key_here
DARAJA_CONSUMER_SECRET=your_consumer_secret_here
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
DARAJA_ENVIRONMENT=production
```

### Step 3: Configure on Render Dashboard

1. Go to **https://dashboard.render.com**
2. Select your **lendhub-backend** service
3. Click **Environment** (left sidebar)
4. Add these variables:
   - `PAYMENT_PROVIDER` = `daraja`
   - `DARAJA_CONSUMER_KEY` = your key
   - `DARAJA_CONSUMER_SECRET` = your secret
   - `DARAJA_BUSINESS_SHORTCODE` = `5416814`
   - `DARAJA_CALLBACK_URL` = `https://api.lendhub.render.com/api/payments/callback`
   - `MONGODB_URI` = your database connection
5. Click **Save**
6. Render will auto-redeploy

### Step 4: Update Daraja Account

1. Log in to **https://developer.safaricom.co.ke**
2. Go to your app settings
3. Add/Update Callback URLs:
   - **Confirmation URL**: `https://api.lendhub.render.com/api/payments/callback`
   - **Validation URL**: `https://api.lendhub.render.com/api/payments/validate` (if needed)
4. Save settings

---

## 🚀 Business Shortcode (partb)

**Value:** `5416814`

This is your M-Pesa:
- **Till Number** (if using till payments), OR
- **Business Short Code** (if using merchant account), OR
- **Paybill Number** (if using paybill)

This value is used in the STK Push request to route payments correctly.

---

## 🧪 Testing the Setup

### Test in Sandbox (Recommended First)

1. Change `DARAJA_ENVIRONMENT=sandbox`
2. Use **Test Credentials** from Daraja dashboard
3. Use test phone number: `254708374149`
4. Process a test payment

### Test in Production

1. Use `DARAJA_ENVIRONMENT=production`
2. Use **Production Credentials** 
3. Use real phone number
4. Process a real payment

---

## 📞 Common Issues

### Issue: "Invalid Business Shortcode"
- **Solution:** Verify `DARAJA_BUSINESS_SHORTCODE=5416814` is correct in Daraja account
- **Action:** Check Daraja dashboard - get exact shortcode value

### Issue: "Invalid Consumer Key"
- **Solution:** Verify credentials are correct
- **Action:** Copy keys again from Daraja dashboard

### Issue: "Callback URL not working"
- **Solution:** Ensure callback URL is whitelisted in Daraja account
- **Action:** Go to Daraja dashboard → App Settings → Add callback URL

### Issue: "STK Push timeout"
- **Solution:** Check internet connection and Render uptime
- **Action:** Test with `DARAJA_ENVIRONMENT=sandbox` first

---

## 🔐 Security Best Practices

✅ **ALWAYS:**
- Store secrets in `.env` (never commit)
- Use environment variables on production
- Rotate credentials regularly
- Monitor payment callbacks

❌ **NEVER:**
- Commit `.env` to GitHub
- Share credentials in messages
- Hardcode keys in source code
- Use production keys in sandbox

---

## 📚 References

- [Daraja Documentation](https://developer.safaricom.co.ke/)
- [M-Pesa API Specs](https://developer.safaricom.co.ke/docs/)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

## ✅ Verification Checklist

Before going live:

- [ ] Consumer Key obtained from Daraja
- [ ] Consumer Secret obtained from Daraja  
- [ ] Business Shortcode = `5416814` configured
- [ ] Callback URL registered in Daraja account
- [ ] `.env` file NOT committed to Git
- [ ] Render dashboard has all secrets
- [ ] Test payment works in sandbox
- [ ] Test payment works in production
- [ ] Callbacks are received and logged

---

**Ready to process payments with Daraja M-Pesa! 🚀**
