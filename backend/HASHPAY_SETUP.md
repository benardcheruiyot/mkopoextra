# Hashpay Integration Setup Guide

## ✅ Completed

- [x] Hashpay API credentials configured in `.env`
- [x] Payment abstraction layer implemented
- [x] Hashpay service with API integration
- [x] STK push initiation (`initiatePayment`)
- [x] Payment status checking (`checkPaymentStatus`)
- [x] Callback webhook parsing
- [x] Token caching for authentication
- [x] Basic Auth with API Key/Secret

## 🚀 Next Steps

### 1. **Set Up MongoDB Database** (CRITICAL)

Your application uses MongoDB to store:
- User accounts
- Loan applications
- Payment transactions
- Web push subscriptions

**Option A: MongoDB Atlas (Recommended - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Add your current IP to network access
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/loan_app`
5. Add to `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/loan_app
   ```

**Option B: Local MongoDB**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/loan_app
```
Requires MongoDB installed locally

### 2. **Test STK Push Locally**

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run dev

# Terminal 2: Start frontend
cd frontend
npm install
npm start
```

**Test Flow:**
1. Go to http://localhost:3000
2. Register with phone: `0700000000` or `254700000000`
3. Apply for loan
4. Initiate payment
5. Check backend logs for Hashpay API calls

### 3. **Verify Hashpay API Endpoints**

The implementation assumes these Hashpay API endpoints:
- `POST /api/v1/stk-push` - Initiate STK push
- `GET /api/v1/payment/status/{checkoutRequestId}` - Check payment status
- `POST /api/v1/auth/token` - Get access token (optional)

**If your Hashpay API uses different endpoints:**
1. Update `/src/services/hashpayService.js` paths in `initiatePayment()` and `checkPaymentStatus()`
2. Adjust request/response formats to match Hashpay's actual API

### 4. **Test Webhook Callback**

Once deployed to Render:
1. Hashpay will send POST to: `https://api.lendhub.render.com/api/payments/callback`
2. Backend will:
   - Parse callback payload
   - Update PaymentTransaction status
   - Create Loan if payment successful
   - Send push notification to user

### 5. **Troubleshooting**

**If STK push fails:**
- Check backend logs: `[Hashpay] Error initiating payment:`
- Verify `HASHPAY_API_KEY` and `HASHPAY_API_SECRET` are correct
- Ensure phone number is in format: `254XXXXXXXXX` (12 digits)
- Verify amount is between 5500-150000 KES

**If status check fails:**
- Ensure `checkoutRequestId` from initiate response is being stored
- Check if Hashpay API endpoint path is correct

**If callback doesn't trigger:**
- Verify `HASHPAY_CALLBACK_URL` is publicly accessible
- Check Hashpay dashboard for webhook logs
- Ensure callback endpoint is not behind authentication

## 📝 Payment Flow

```
1. User initiates payment
   ↓
2. Frontend calls POST /api/payments/initiate
   ↓
3. Backend calls Hashpay STK push API
   ↓
4. Hashpay returns checkout request ID
   ↓
5. Frontend stores reference and polls status
   ↓
6. User confirms STK on phone
   ↓
7. Hashpay sends callback to POST /api/payments/callback
   ↓
8. Backend updates transaction status to 'completed'
   ↓
9. Backend creates Loan record
   ↓
10. Backend sends push notification
```

## 🔗 File Locations

- Backend service: `src/services/hashpayService.js`
- Payment abstraction: `src/services/paymentService.js`
- Loan controller: `src/controllers/loanController.js`
- Payment routes: `src/routes/index.js`
- Configuration: `.env`

## 📞 Support

For Hashpay API questions:
- Visit: https://www.hashpay.co.ke
- Check: Hashpay API documentation
- Dashboard: https://api.hashpay.co.ke/dashboard
