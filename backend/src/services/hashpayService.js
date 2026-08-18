const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

class HashpayService {
  constructor() {
    this.refreshRuntimeConfig();
    this.apiKey = String(process.env.HASHPAY_API_KEY || '').trim();
    this.apiSecret = String(process.env.HASHPAY_API_SECRET || '').trim();
    this.environment = String(process.env.HASHPAY_ENVIRONMENT || 'production').trim().toLowerCase();
    this.baseUrl = String(process.env.HASHPAY_BASE_URL || 'https://api.hashpay.co.ke').trim();
    this.callbackUrl = String(process.env.HASHPAY_CALLBACK_URL || '').trim();
    this.cachedToken = null;
    this.cachedTokenExpiresAt = 0;

    this.isConfigured = this.isProperlyConfigured();
    if (!this.isConfigured) {
      console.warn('[Hashpay] ⚠️  Hashpay is not fully configured. Set HASHPAY_API_KEY, HASHPAY_API_SECRET, and HASHPAY_CALLBACK_URL.');
    } else {
      console.log(`[Hashpay] ✅ Hashpay configured for ${this.environment}`);
    }
  }

  refreshRuntimeConfig() {
    const envPaths = [
      path.resolve(__dirname, '../../.env'),
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../../backend/.env'),
    ];

    for (const envPath of envPaths) {
      dotenv.config({ path: envPath, override: false });
    }

    this.apiKey = String(process.env.HASHPAY_API_KEY || this.apiKey).trim();
    this.apiSecret = String(process.env.HASHPAY_API_SECRET || this.apiSecret).trim();
    this.environment = String(process.env.HASHPAY_ENVIRONMENT || this.environment).trim().toLowerCase();
    this.baseUrl = String(process.env.HASHPAY_BASE_URL || this.baseUrl).trim();
    this.callbackUrl = String(process.env.HASHPAY_CALLBACK_URL || this.callbackUrl).trim();
  }

  isProperlyConfigured() {
    return Boolean(this.apiKey && this.apiSecret && this.baseUrl && this.callbackUrl);
  }

  async requestJson(method, urlPath, { headers = {}, body, timeout = 20000 } = {}) {
    const fullUrl = `${this.getBaseUrl()}${urlPath}`;
    console.log(`[Hashpay] ${method} ${fullUrl}`);
    if (body) {
      console.log(`[Hashpay] Request body:`, JSON.stringify(body));
    }

    try {
      const config = {
        method: method.toLowerCase(),
        url: fullUrl,
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers,
        },
        validateStatus: () => true,  // Don't throw on any status code - let us handle it
      };

      if (body) {
        config.data = body;
      }

      const response = await axios(config);

      console.log(`[Hashpay] Response HTTP ${response.status}:`, JSON.stringify(response.data));

      // Return response data for ALL status codes - caller handles success/failure
      return response.data || {};
    } catch (error) {
      console.error(`[Hashpay] Network error:`, error.message);
      throw error;
    }
  }

  getBaseUrl() {
    if (!this.baseUrl) {
      return this.environment === 'sandbox'
        ? 'https://sandbox.hashpay.co.ke'
        : 'https://api.hashpay.co.ke';
    }
    return this.baseUrl;
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
    // HashBack doesn't use token authentication - API key is passed in request body
    // This method is kept for compatibility but returns null (not needed for HashBack)
    return null;
  }

  async initiatePayment(phone, amount) {
    this.refreshRuntimeConfig();

    if (!this.isProperlyConfigured()) {
      return {
        success: false,
        message:
          'Hashpay is not configured. Set HASHPAY_API_KEY, HASHPAY_API_SECRET, HASHPAY_BASE_URL, and HASHPAY_CALLBACK_URL.',
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
      console.log(`[Hashpay] Initiating STK push for ${normalizedPhone}, amount: KES ${amount}`);

      // Generate unique checkout request ID for tracking
      const checkoutRequestId = `CHK-${Date.now()}`;
      const merchantRequestId = `MR-${Date.now()}`;

      // Use Account ID (5892851) as walletid - this is the merchant's account identifier
      const walletIdValue = String(process.env.HASHPAY_ACCOUNT_ID || '5892851').trim();

      // HashBack /v2/topup endpoint - send all relevant fields
      const payload = {
        api_key: this.apiKey,
        msisdn: normalizedPhone,  // Phone with country code: 254XXXXXXXXX
        amount: Number(amount),   // Amount as integer
        walletid: walletIdValue,  // Use Account ID as walletid
        description: `Payment for loan processing`,
        reference: checkoutRequestId,
        callback_url: this.callbackUrl,
      };

      console.log(`[Hashpay] Request to /v2/topup with account_id/walletid="${walletIdValue}"`, {
        endpoint: '/v2/topup',
        phone: normalizedPhone,
        amount: amount,
      });

      // Make API call to HashBack v2/topup endpoint
      const response = await this.requestJson('POST', '/v2/topup', {
        body: payload,
      });

      console.log(`[Hashpay] Response from /v2/topup:`, response);

      // Check if request was successful (look for success field or error field)
      const isSuccess = response.success === true || (response.status === 'success' && !response.error);
      const errorMsg = response.message || response.error || response.errorMessage || null;

      if (!isSuccess || errorMsg) {
        return {
          success: false,
          message: errorMsg || 'Payment initiation failed',
          rawResponse: response,
        };
      }

      // Success response
      return {
        success: true,
        checkoutRequestId: response.CheckoutRequestID || response.checkout_request_id || checkoutRequestId,
        merchantRequestId: response.MerchantRequestID || response.merchant_request_id || merchantRequestId,
        message: 'STK push initiated successfully',
        rawResponse: response,
      };
    } catch (error) {
      console.error('[Hashpay] Network error:', error.message);

      return {
        success: false,
        message: 'Failed to connect to payment gateway',
        rawResponse: null,
      };
    }
  }

  async checkPaymentStatus(checkoutRequestId) {
    this.refreshRuntimeConfig();
    if (!this.isProperlyConfigured()) {
      return {
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription:
          'Hashpay is not configured. Set Hashpay credentials and implement payment status lookup.',
      };
    }

    try {
      console.log(`[Hashpay] Checking payment status for transaction: ${checkoutRequestId}`);

      // HashBack v1/pullapi endpoint - pass API key in request body
      const payload = {
        api_key: this.apiKey,
        account_id: this.apiKey,  // Use API key as account_id
        transaction_id: checkoutRequestId,
      };

      // Query HashBack for transaction status
      const response = await this.requestJson('POST', '/v1/pullapi', {
        body: payload,
      });

      console.log(`[Hashpay] Status check response:`, response);

      // Parse the response
      const statusRaw = String(response.status || response.result || response.resultCode || 'pending').toLowerCase();
      let status = 'pending';

      if (['success', 'completed', 'paid', 'confirmed'].includes(statusRaw)) {
        status = 'completed';
      } else if (['failed', 'error', 'declined', 'cancelled', 'canceled', 'expired'].includes(statusRaw)) {
        status = 'failed';
      }

      return {
        success: status === 'completed',
        status,
        resultCode: response.resultCode || response.code || null,
        resultDescription: response.resultDescription || response.message || 'Payment status unknown',
        receiptNumber: response.receiptNumber || response.receipt_number || null,
        rawResponse: response,
      };
    } catch (error) {
      console.error('[Hashpay] Error checking payment status:', error);

      // If transaction not found, it might still be pending
      if (error.response?.status === 404) {
        return {
          success: false,
          status: 'pending',
          resultCode: null,
          resultDescription: 'Transaction not found yet - still processing',
        };
      }

      return {
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: error.message || 'Failed to check payment status',
      };
    }
  }

  parseCallback(body) {
    if (!body || typeof body !== 'object') return null;

    const transactionId =
      body.transactionId || body.transaction_id || body.reference || body.checkoutRequestId || body.orderId || null;
    const statusRaw = String(body.status || body.result || body.resultCode || '').toLowerCase();
    let status = null;

    if (['success', 'completed', 'paid'].includes(statusRaw)) {
      status = 'completed';
    } else if (['failed', 'error', 'declined', 'cancelled', 'canceled'].includes(statusRaw)) {
      status = 'failed';
    } else if (['pending', 'processing', 'awaiting_payment'].includes(statusRaw)) {
      status = 'pending';
    }

    if (!transactionId) return null;

    return {
      transactionId,
      merchantRequestId: body.merchantRequestId || body.merchant_request_id || null,
      status,
      resultCode: body.resultCode || body.code || null,
      resultDescription: body.resultDescription || body.message || body.description || null,
      receiptNumber: body.receiptNumber || body.receipt_number || null,
      callbackData: body,
    };
  }
}

module.exports = new HashpayService();
