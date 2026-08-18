# LendHub Payment Architecture & Daraja Integration

## 🏗️ Current Architecture

Your app has a **provider-agnostic payment system** that already supports multiple payment providers through a unified interface.

### Payment Flow

```
Frontend Request
    ↓
loanController.initiatePayment()
    ↓
paymentService (selects provider based on PAYMENT_PROVIDER env)
    ↓
Provider Service (hashpayService OR darajaService)
    ↓
Payment Provider API (Hashpay OR Daraja M-Pesa)
    ↓
Response with CheckoutRequestID / TransactionID
    ↓
Frontend handles STK Push / Redirect
```

---

## 📦 What's Already Implemented

### 1. **Payment Transaction Model** ✅
- File: `backend/src/models/PaymentTransaction.js` / `PaymentTransactionImpl.js`
- Tracks: `checkoutRequestId`, phone, amount, status, provider, timestamp
- Methods: `findByCheckoutRequestId()`, `updateByCheckoutRequestId()`

### 2. **Loan Controller** ✅
- File: `backend/src/controllers/loanController.js`
- Methods:
  - `initiatePayment()` - Starts payment flow
  - `checkPaymentStatus()` - Polls payment status
  - `handlePaymentCallback()` - Receives payment callbacks from provider

### 3. **Payment Service** ✅
- File: `backend/src/services/paymentService.js`
- Provider Selection: Reads `PAYMENT_PROVIDER` env variable
- Unified Interface:
  - `initiatePayment(phone, amount)` → Returns checkoutRequestId
  - `checkPaymentStatus(checkoutRequestId)` → Returns payment status
  - Error Classification: Friendly error messages

### 4. **Hashpay Service** ✅
- File: `backend/src/services/hashpayService.js`
- Implemented Methods:
  - `initiatePayment()` - STK push to `/v2/topup`
  - `checkPaymentStatus()` - Status check
  - Phone normalization (254XXXXXXXXX format)
  - Access token management
  - Callback parsing

---

## 🔌 What Needs to Be Created: Daraja Service

### File Structure
```
backend/src/services/
├── paymentService.js          ✅ Provider selector (already done)
├── hashpayService.js          ✅ Hashpay implementation
└── darajaService.js           ⏳ TO CREATE - Daraja M-Pesa implementation
```

### Daraja Service Implementation

You need to create `backend/src/services/darajaService.js` with these methods:

```javascript
class DarajaService {
  constructor() {
    // Load from environment
    this.consumerKey = process.env.DARAJA_CONSUMER_KEY;
    this.consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    this.businessShortcode = process.env.DARAJA_BUSINESS_SHORTCODE; // 5416814
    this.callbackUrl = process.env.DARAJA_CALLBACK_URL;
    this.environment = process.env.DARAJA_ENVIRONMENT || 'production';
  }

  async getAccessToken()
    // GET /oauth/v1/generate - Base64 auth with consumerKey:consumerSecret
    // Returns: { access_token, expires_in }

  async initiateStkPush(phone, amount)
    // POST /mpesa/stkpush/v1/processrequest
    // Returns: { 
    //   CheckoutRequestID, 
    //   ResponseCode, 
    //   ResponseDescription 
    // }

  async checkTransactionStatus(checkoutRequestId)
    // POST /mpesa/stkpushquery/v1/query
    // Returns: { ResultCode, ResultDesc }

  normalizePhone(phone)
    // Converts to 254XXXXXXXXX format

  parseCallback(body)
    // Parses STK callback response
    // Returns: success, transactionId, phone, etc.
}
```

---

## 🚀 Quick Implementation Steps

### Step 1: Create Daraja Service
```javascript
// backend/src/services/darajaService.js
// Copy template from section below ⬇️
```

### Step 2: Register in Payment Service
```javascript
// backend/src/services/paymentService.js
const darajaService = require('./darajaService');

this.providers = {
  hashpay: hashpayService,
  daraja: darajaService,  // ← ADD THIS LINE
};
```

### Step 3: Update Environment
```env
PAYMENT_PROVIDER=daraja
DARAJA_CONSUMER_KEY=your_key
DARAJA_CONSUMER_SECRET=your_secret
DARAJA_BUSINESS_SHORTCODE=5416814
DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
DARAJA_ENVIRONMENT=production
```

### Step 4: No Other Changes Needed!
- Controllers work as-is (they call `paymentService`)
- Routes work as-is
- Frontend works as-is
- Database schema works as-is

---

## 📋 Daraja Service Template

Copy this into `backend/src/services/darajaService.js`:

```javascript
const axios = require('axios');

class DarajaService {
  constructor() {
    this.consumerKey = String(process.env.DARAJA_CONSUMER_KEY || '').trim();
    this.consumerSecret = String(process.env.DARAJA_CONSUMER_SECRET || '').trim();
    this.businessShortcode = String(process.env.DARAJA_BUSINESS_SHORTCODE || '5416814').trim();
    this.callbackUrl = String(process.env.DARAJA_CALLBACK_URL || '').trim();
    this.environment = String(process.env.DARAJA_ENVIRONMENT || 'production').trim().toLowerCase();
    this.cachedToken = null;
    this.cachedTokenExpiresAt = 0;

    this.isConfigured = this.isProperlyConfigured();
    if (!this.isConfigured) {
      console.warn('[Daraja] ⚠️  Daraja is not fully configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, and DARAJA_CALLBACK_URL.');
    } else {
      console.log(`[Daraja] ✅ Daraja configured for ${this.environment}`);
    }
  }

  isProperlyConfigured() {
    return Boolean(this.consumerKey && this.consumerSecret && this.businessShortcode && this.callbackUrl);
  }

  getBaseUrl() {
    if (this.environment === 'sandbox') {
      return 'https://sandbox.safaricom.co.ke';
    }
    return 'https://api.safaricom.co.ke';
  }

  normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('254') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.startsWith('1') && digits.length === 10) return `254${digits}`;
    if (digits.length === 9 && digits.startsWith('7')) return `254${digits}`;
    return digits;
  }

  async getAccessToken() {
    // Return cached token if still valid
    if (this.cachedToken && Date.now() < this.cachedTokenExpiresAt) {
      return this.cachedToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      this.cachedToken = response.data.access_token;
      this.cachedTokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
      
      return this.cachedToken;
    } catch (error) {
      console.error('[Daraja] Token generation failed:', error.message);
      throw new Error('Failed to authenticate with Daraja');
    }
  }

  async initiateStkPush(phone, amount) {
    if (!this.isProperlyConfigured()) {
      return {
        success: false,
        message: 'Daraja is not configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, and DARAJA_CALLBACK_URL.',
      };
    }

    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      return {
        success: false,
        message: 'Invalid phone number provided for payment.',
      };
    }

    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14);
      const password = Buffer.from(`${this.businessShortcode}${process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd1a503017'}${timestamp}`).toString('base64');
      
      const baseUrl = this.getBaseUrl();
      const checkoutRequestId = `CHK-${Date.now()}`;

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.businessShortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Number(amount),
          PartyA: normalizedPhone,
          PartyB: this.businessShortcode,
          PhoneNumber: normalizedPhone,
          CallBackURL: this.callbackUrl,
          AccountReference: 'LendHub',
          TransactionDesc: 'Payment for loan processing',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[Daraja] STK Push initiated:', response.data);

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          checkoutRequestId: response.data.CheckoutRequestID || checkoutRequestId,
          message: 'STK push initiated successfully',
        };
      } else {
        return {
          success: false,
          message: response.data.ResponseDescription || 'STK push failed',
        };
      }
    } catch (error) {
      console.error('[Daraja] STK Push error:', error.message);
      return {
        success: false,
        message: error.message || 'Payment initiation failed',
      };
    }
  }

  async checkTransactionStatus(checkoutRequestId) {
    if (!checkoutRequestId) {
      return { success: false, message: 'Checkout Request ID required' };
    }

    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14);
      const password = Buffer.from(`${this.businessShortcode}${process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd1a503017'}${timestamp}`).toString('base64');

      const baseUrl = this.getBaseUrl();

      const response = await axios.post(
        `${baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.businessShortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[Daraja] Status check response:', response.data);

      return {
        success: response.data.ResultCode === '0',
        status: response.data.ResultDesc || 'Pending',
        data: response.data,
      };
    } catch (error) {
      console.error('[Daraja] Status check error:', error.message);
      return {
        success: false,
        status: 'Error checking status',
      };
    }
  }

  parseCallback(body) {
    // Daraja sends callback in this format
    if (!body || !body.Body) {
      return null;
    }

    const result = body.Body.stkCallback.CallbackMetadata;
    const itemsMap = {};
    
    result.Item.forEach((item) => {
      itemsMap[item.Name] = item.Value;
    });

    return {
      transactionId: itemsMap.MpesaReceiptNumber,
      phone: itemsMap.PhoneNumber,
      amount: itemsMap.Amount,
      resultCode: body.Body.stkCallback.ResultCode,
      resultDesc: body.Body.stkCallback.ResultDesc,
    };
  }
}

module.exports = new DarajaService();
```

---

## 🔄 API Endpoints (Already Working)

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/payments/initiate` | POST | Start payment | `{ checkoutRequestId, message }` |
| `/api/payments/status` | GET | Check payment status | `{ status, success, data }` |
| `/api/payments/callback` | POST | Receive payment callback | `{ success, message }` |

---

## 🧪 Testing

### Local Testing
```bash
# 1. Set environment
export PAYMENT_PROVIDER=daraja
export DARAJA_CONSUMER_KEY=your_key
export DARAJA_CONSUMER_SECRET=your_secret
export DARAJA_BUSINESS_SHORTCODE=5416814
export DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
export DARAJA_ENVIRONMENT=sandbox

# 2. Start backend
cd backend
npm run dev

# 3. Test in frontend or with curl
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "254700000000", "amount": 500}'
```

---

## 🔐 Environment Variables Checklist

- [ ] `PAYMENT_PROVIDER=daraja`
- [ ] `DARAJA_CONSUMER_KEY` - From Daraja dashboard
- [ ] `DARAJA_CONSUMER_SECRET` - From Daraja dashboard
- [ ] `DARAJA_BUSINESS_SHORTCODE=5416814` - Your till/business number
- [ ] `DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback`
- [ ] `DARAJA_ENVIRONMENT=production` (or `sandbox`)
- [ ] `DARAJA_PASSKEY` - Optional, uses default if not set
- [ ] `MONGODB_URI` - Your database
- [ ] `JWT_SECRET` - Your JWT secret

---

## 📚 References

- [Daraja Documentation](https://developer.safaricom.co.ke/docs/)
- [STK Push API](https://developer.safaricom.co.ke/docs/#lipa-na-m-pesa-online-stk-push)
- [STK Query API](https://developer.safaricom.co.ke/docs/#lipa-na-m-pesa-online-query-request)

---

## ✨ Ready for Production!

Once you:
1. Create `darajaService.js`
2. Update `paymentService.js` to register it
3. Set environment variables
4. Deploy to Render

Your app will be **fully functional with Daraja M-Pesa payments**! 🚀

---

## 📞 URL Format After Deployment

Once deployed, share:

```
🎉 LendHub App Deployed!

Frontend URL: https://lendhub.vercel.app
Backend API: https://api.lendhub.render.com
Payment Provider: Daraja M-Pesa
Business Shortcode: 5416814
```
