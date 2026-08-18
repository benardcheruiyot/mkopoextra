const darajaService = require('./darajaService');

class PaymentService {
  constructor() {
    this.providers = {
      daraja: darajaService,
    };
    this.providerName = this.resolveProviderName();
    this.provider = this.providers[this.providerName];

    console.log(`[PaymentService] Using provider: ${this.getProviderName()}`);
  }

  resolveProviderName() {
    const requested = String(process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();

    if (requested === 'daraja') {
      return 'daraja';
    }

    return 'daraja';
  }

  normalizePaymentError(rawValue) {
    if (rawValue == null) return '';

    if (typeof rawValue === 'string') {
      return rawValue.replace(/\s+/g, ' ').trim();
    }

    if (rawValue instanceof Error) {
      return this.normalizePaymentError(rawValue.message);
    }

    if (typeof rawValue === 'object') {
      const candidates = [
        rawValue.message,
        rawValue.error,
        rawValue.errorMessage,
        rawValue.detail,
        rawValue.description,
        rawValue.resultDescription,
      ];

      for (const candidate of candidates) {
        const normalized = this.normalizePaymentError(candidate);
        if (normalized) return normalized;
      }

      try {
        return this.normalizePaymentError(JSON.stringify(rawValue));
      } catch (error) {
        return '';
      }
    }

    return String(rawValue).replace(/\s+/g, ' ').trim();
  }

  classifyPaymentError(rawMessage) {
    const normalizedMessage = this.normalizePaymentError(rawMessage);
    if (!normalizedMessage) {
      return 'Payment processing failed. Please try again.';
    }

    const lowerMsg = normalizedMessage.toLowerCase();

    if (
      /failed\s+to\s+authenticate|auth.*fail|authenticat|credential|unauthorized|invalid\s+credentials|not\s+authorized|401|403/.test(lowerMsg)
    ) {
      return 'Payment authentication failed. Please try again or contact support.';
    }

    if (/invalid.*phone|phone.*invalid|invalid.*number|number.*invalid/.test(lowerMsg)) {
      return 'Payment failed. Please review your phone number and try again.';
    }

    if (/error|failed|invalid/.test(lowerMsg) && !/success/i.test(lowerMsg)) {
      return 'Payment processing failed. Please try again.';
    }

    return normalizedMessage;
  }

  getProviderName() {
    return this.providerName;
  }

  getProvider() {
    return this.provider;
  }

  async initiatePayment(phone, amount) {
    let result = null;
    if (typeof this.provider.initiatePayment === 'function') {
      result = await this.provider.initiatePayment(phone, amount);
    } else if (typeof this.provider.initiateStkPush === 'function') {
      result = await this.provider.initiateStkPush(phone, amount);
    } else {
      result = {
        success: false,
        message: 'Payment provider does not support a payment initiation method.',
      };
    }

    if (result && typeof result.message === 'string') {
      const originalMessage = result.message;
      const finalMessage = this.classifyPaymentError(originalMessage);

      if (finalMessage !== originalMessage) {
        console.log(`[PaymentService] Normalized payment error: "${originalMessage}" -> "${finalMessage}"`);
      }

      result.message = finalMessage;
    }

    return result;
  }

  async checkPaymentStatus(checkoutRequestId) {
    if (typeof this.provider.checkPaymentStatus === 'function') {
      return this.provider.checkPaymentStatus(checkoutRequestId);
    }

    if (typeof this.provider.checkTransactionStatus === 'function') {
      return this.provider.checkTransactionStatus(checkoutRequestId);
    }

    return {
      success: false,
      status: 'pending',
      resultCode: null,
      resultDescription: 'Payment provider does not support status checks.',
    };
  }

  parseCallback(body) {
    if (typeof this.provider.parseCallback === 'function') {
      return this.provider.parseCallback(body);
    }
    return null;
  }
}

module.exports = new PaymentService();
