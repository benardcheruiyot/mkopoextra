const paymentService = require('./paymentService');

describe('PaymentService.initiatePayment', () => {
  const originalProvider = paymentService.provider;

  afterEach(() => {
    paymentService.provider = originalProvider;
  });

  it('does not rewrite provider auth failures into a phone-number error', async () => {
    paymentService.provider = {
      initiatePayment: async () => ({
        success: false,
        message: 'Failed to authenticate with M-Pesa. Please check your payment credentials.',
      }),
    };

    const result = await paymentService.initiatePayment('254712345678', 1000);

    expect(result.message).not.toMatch(/phone number/i);
    expect(result.message).toMatch(/authenticate|credentials|payment failed|try again/i);
  });

  it('keeps the phone-number message only for actual invalid phone errors', async () => {
    paymentService.provider = {
      initiatePayment: async () => ({
        success: false,
        message: 'Invalid phone number provided for payment.',
      }),
    };

    const result = await paymentService.initiatePayment('invalid-phone', 1000);

    expect(result.message).toMatch(/phone number/i);
  });

  it('selects the Daraja provider when PAYMENT_PROVIDER=daraja', () => {
    const previous = process.env.PAYMENT_PROVIDER;
    process.env.PAYMENT_PROVIDER = 'daraja';

    jest.resetModules();
    const reloaded = require('./paymentService');
    const darajaService = require('./darajaService');

    expect(reloaded.getProviderName()).toBe('daraja');
    expect(reloaded.getProvider()).toBe(darajaService);

    process.env.PAYMENT_PROVIDER = previous;
  });
});
