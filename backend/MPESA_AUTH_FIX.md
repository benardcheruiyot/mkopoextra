# M-Pesa Authentication Issue - Resolution Guide

## 🚨 ROOT CAUSE IDENTIFIED

The "Failed to authenticate with M-Pesa" error is occurring because:

### **Hashpay API Domain is Not Resolving**
```
❌ api.hashpay.co.ke → DNS lookup FAILED (Non-existent domain)
```

This means your backend cannot reach Hashpay servers to authenticate or process payments.

---

## ✅ What's Been Fixed

1. **✅ MongoDB Connection** - Successfully configured with your Atlas database
   - String: `mongodb+srv://bcheruiyot221_db_user:3UAZ5oToTlyQVAML@cluster0.aqghn4v.mongodb.net/?appName=Cluster0`
   - Status: READY

---

## ❌ What Needs Fixing

### Issue: Hashpay API Domain Configuration

Your current `.env` has:
```env
HASHPAY_BASE_URL=https://api.hashpay.co.ke
HASHPAY_API_KEY=HP033869
HASHPAY_API_SECRET=h26419WyK6vAK
```

But when we tested, the domain `api.hashpay.co.ke` **does not resolve** on DNS.

---

## 🔧 Solution: Choose One

### **Option A: Verify Your Hashpay Account (RECOMMENDED)**

1. Go to your Hashpay dashboard
2. Find **API Documentation** or **API Keys** section
3. Check:
   - ✓ Are your credentials `HP033869` / `h26419WyK6vAK` correct?
   - ✓ What is the correct API endpoint URL?
   - ✓ Are they production or sandbox credentials?
4. Update your `.env` with the correct endpoint:
   ```env
   HASHPAY_BASE_URL=https://[CORRECT_ENDPOINT_FROM_HASHPAY]
   HASHPAY_ENVIRONMENT=production  # or sandbox
   ```

### **Option B: Use Hashpay Sandbox (for Testing)**

If Hashpay offers a sandbox environment:
```env
HASHPAY_BASE_URL=https://sandbox.hashpay.co.ke
# or check Hashpay docs for correct sandbox URL
HASHPAY_ENVIRONMENT=sandbox
```

### **Option C: Switch to M-Pesa Daraja (Alternative)**

If Hashpay credentials are invalid, use the official M-Pesa Daraja API:

1. Register at: https://developer.safaricom.co.ke/
2. Get your Daraja credentials
3. Use this updated `.env`:
   ```env
   PAYMENT_PROVIDER=daraja
   DARAJA_CONSUMER_KEY=your_consumer_key
   DARAJA_CONSUMER_SECRET=your_consumer_secret
   DARAJA_CALLBACK_URL=https://api.lendhub.render.com/api/payments/callback
   ```

---

## 📋 Troubleshooting Checklist

- [ ] **Step 1**: Contact Hashpay or check your account dashboard for the correct API endpoint
- [ ] **Step 2**: Verify API credentials (HP033869 / h26419WyK6vAK) are correct
- [ ] **Step 3**: Check if using production or sandbox environment
- [ ] **Step 4**: Update `.env` with correct endpoint
- [ ] **Step 5**: Restart backend and test again

---

## 🧪 How to Test After Fixing

Once you update the Hashpay domain, run the diagnostic:

```bash
cd backend
npm run dev  # Start backend

# In another terminal
node test-hashpay-connection.js
```

You should see:
```
✅ Authentication successful!
✅ STK Push endpoint accessible!
```

---

## 📞 Still Not Working?

1. **Check Network**: Ensure your network can reach external APIs
   ```powershell
   nslookup [your-api-domain]
   ```

2. **Check Credentials**: Verify with Hashpay support
   - API Key format
   - API Secret format
   - Endpoint URL
   - IP whitelist requirements

3. **Check Logs**: 
   ```bash
   npm run dev
   # Look for: [Hashpay] ❌ Error...
   ```

4. **Test Phone Format**: Must be `254XXXXXXXXX`
   - Valid: `254700123456`
   - Invalid: `0700123456` (will be converted)

---

## 🔒 Security Note

- Keep your API credentials secure
- Never commit `.env` to version control
- Rotate credentials if exposed

