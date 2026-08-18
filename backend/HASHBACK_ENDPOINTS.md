# HashBack API Integration - Configuration Guide

## Current Status
✅ Domain fixed: `https://api.hashback.co.ke` (confirmed resolving)
❌ Endpoints discovery: In progress (endpoints returning 404)

---

## What You Need to Do

### Step 1: Find Your HashBack API Documentation

Go to your HashBack dashboard and locate the **API Documentation** section. You need to find:

1. **Token/Authentication Endpoint**
   - What is the full path to get an access token?
   - Example: `/api/v1/auth/token` or `/token` or `/oauth/token`?

2. **STK Push Endpoint**
   - What is the full path to initiate an STK push?
   - Example: `/api/v1/stk-push` or `/V2/stk-push` or `/stk-push`?

3. **Payment Status Endpoint**
   - What is the full path to check payment status?
   - Example: `/api/v1/payment/status/{id}` or `/status`?

---

## Step 2: Update Render Dashboard

Once you have the endpoints from your HashBack docs, **add all variables to Render:**

```
HASHPAY_BASE_URL=https://api.hashback.co.ke
HASHPAY_API_KEY=HP033869
HASHPAY_API_SECRET=h26419WyK6vAK
HASHPAY_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
HASHPAY_ENVIRONMENT=production
MONGODB_URI=mongodb+srv://bcheruiyot221_db_user:3UAZ5oToTlyQVAML@cluster0.aqghn4v.mongodb.net/?appName=Cluster0
```

---

## Step 3: Provide Me the Endpoints

Once you have the three endpoints from HashBack docs, give me:

```
Token Endpoint: /___
STK Push Endpoint: /___
Status Endpoint: /___
```

I'll then:
1. Update `backend/src/services/hashpayService.js` with correct paths
2. Test the complete payment flow
3. Verify M-Pesa authentication works

---

## Quick Checklist

- [ ] Open your HashBack dashboard
- [ ] Find API Documentation section
- [ ] Locate token endpoint path
- [ ] Locate STK push endpoint path
- [ ] Locate payment status endpoint path
- [ ] Share the three paths with me
- [ ] I'll update the code and test

