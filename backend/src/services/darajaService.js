const axios = require('axios');

class DarajaService {
  constructor() {
    this.consumerKey = String(process.env.DARAJA_CONSUMER_KEY || '').trim();
    this.consumerSecret = String(process.env.DARAJA_CONSUMER_SECRET || '').trim();
    this.businessShortcode = String(process.env.DARAJA_BUSINESS_SHORTCODE || '5416814').trim();
    this.partyBShortcode = String(process.env.DARAJA_PARTYB_SHORTCODE || this.businessShortcode).trim();
    this.passkey = String(process.env.DARAJA_PASSKEY || '').trim();
    this.callbackUrl = String(process.env.DARAJA_CALLBACK_URL || '').trim();
    this.environment = String(process.env.DARAJA_ENVIRONMENT || 'production').trim().toLowerCase();
    this.cachedToken = null;
    this.cachedTokenExpiresAt = 0;

    this.isConfigured = this.isProperlyConfigured();
    if (!this.isConfigured) {
      console.warn('[Daraja] ⚠️  Daraja is not fully configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_BUSINESS_SHORTCODE, DARAJA_PASSKEY, and DARAJA_CALLBACK_URL.');
    } else {
      console.log(`[Daraja] ✅ Daraja configured for ${this.environment}`);
    }
  }

  refreshRuntimeConfig() {
    this.consumerKey = String(process.env.DARAJA_CONSUMER_KEY || this.consumerKey).trim();
    this.consumerSecret = String(process.env.DARAJA_CONSUMER_SECRET || this.consumerSecret).trim();
    this.businessShortcode = String(process.env.DARAJA_BUSINESS_SHORTCODE || this.businessShortcode || '5416814').trim();
    this.partyBShortcode = String(process.env.DARAJA_PARTYB_SHORTCODE || this.partyBShortcode || this.businessShortcode).trim();
    this.passkey = String(process.env.DARAJA_PASSKEY || this.passkey).trim();
    this.callbackUrl = String(process.env.DARAJA_CALLBACK_URL || this.callbackUrl).trim();
    this.environment = String(process.env.DARAJA_ENVIRONMENT || this.environment || 'production').trim().toLowerCase();
    this.isConfigured = this.isProperlyConfigured();
  }

  isProperlyConfigured() {
    return Boolean(this.consumerKey && this.consumerSecret && this.businessShortcode && this.passkey && this.callbackUrl);
  }

  getBaseUrl() {
    return this.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
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

  getTimestamp() {
    return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  }

  async getAccessToken() {
    if (this.cachedToken && Date.now() < this.cachedTokenExpiresAt) {
      return this.cachedToken;
    }

    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get(`${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: 20000,
    });

    this.cachedToken = response.data.access_token;
    this.cachedTokenExpiresAt = Date.now() + ((response.data.expires_in || 3600) * 1000) - 60000;
    return this.cachedToken;
  }

  async initiatePayment(phone, amount) {
    this.refreshRuntimeConfig();

    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Daraja is not configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_BUSINESS_SHORTCODE, DARAJA_PASSKEY, and DARAJA_CALLBACK_URL.',
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
      const timestamp = this.getTimestamp();
      const password = Buffer.from(`${this.businessShortcode}${this.passkey || ''}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: this.businessShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: Number(amount),
        PartyA: normalizedPhone,
        PartyB: this.partyBShortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: 'LendHub',
        TransactionDesc: 'Payment for loan processing',
      };

      const response = await axios.post(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const result = response.data || {};
      const checkoutRequestId = result.CheckoutRequestID || result.checkoutRequestId || `CHK-${Date.now()}`;
      const merchantRequestId = result.MerchantRequestID || result.merchantRequestId || `MR-${Date.now()}`;

      if (result.ResponseCode && result.ResponseCode !== '0') {
        return {
          success: false,
          message: result.ResponseDescription || 'Daraja payment request failed.',
          rawResponse: result,
        };
      }

      return {
        success: true,
        checkoutRequestId,
        merchantRequestId,
        message: result.ResponseDescription || 'STK push initiated successfully',
        rawResponse: result,
      };
    } catch (error) {
      const message = error.response?.data?.errorMessage || error.response?.data?.RequestError || error.message || 'Failed to connect to Daraja';
      return {
        success: false,
        message,
        rawResponse: error.response?.data || null,
      };
    }
  }

  async checkPaymentStatus(checkoutRequestId) {
    this.refreshRuntimeConfig();
    if (!this.isConfigured) {
      return {
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: 'Daraja is not configured. Set DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, and DARAJA_CALLBACK_URL.',
      };
    }

    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = Buffer.from(`${this.businessShortcode}${this.passkey || ''}${timestamp}`).toString('base64');

      const payload = {
        BusinessShortCode: this.businessShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(`${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const result = response.data || {};
      const resultCode = String(result.ResultCode || '');
      const resultDescription = result.ResultDesc || 'Payment status unknown';
      const status = resultCode === '0' ? 'completed' : resultCode ? 'failed' : 'pending';

      return {
        success: status === 'completed',
        status,
        resultCode,
        resultDescription,
        rawResponse: result,
      };
    } catch (error) {
      return {
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: error.message || 'Failed to check payment status',
      };
    }
  }

  parseCallback(body) {
    if (!body) return null;

    const callback = body.Body && body.Body.stkCallback ? body.Body.stkCallback : body;
    if (!callback) return null;

    const resultCode = callback.ResultCode;
    const metadata = callback.CallbackMetadata && callback.CallbackMetadata.Item ? callback.CallbackMetadata.Item : [];
    const phoneItem = metadata.find((item) => item.Name === 'PhoneNumber');
    const amountItem = metadata.find((item) => item.Name === 'Amount');
    const transactionIdItem = metadata.find((item) => item.Name === 'MpesaReceiptNumber');
    const dateItem = metadata.find((item) => item.Name === 'TransactionDate');

    return {
      success: Number(resultCode) === 0,
      resultCode,
      resultDescription: callback.ResultDesc,
      phone: phoneItem ? phoneItem.Value : null,
      amount: amountItem ? amountItem.Value : null,
      transactionId: transactionIdItem ? transactionIdItem.Value : null,
      transactionDate: dateItem ? dateItem.Value : null,
    };
  }
}

module.exports = new DarajaService();
