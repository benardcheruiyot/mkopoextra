const fs = require('fs');
const path = require('path');

describe('PaymentTransaction persistence', () => {
  const tempDir = path.resolve(__dirname, '../../tmp-model-store');

  beforeEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env.TALA_EXTRA_MODEL_STORE_DIR = tempDir;
    delete require.cache[require.resolve('./PaymentTransactionImpl')];
  });

  afterEach(() => {
    delete process.env.TALA_EXTRA_MODEL_STORE_DIR;
    delete require.cache[require.resolve('./PaymentTransactionImpl')];
  });

  it('loads persisted transactions after a module reload', async () => {
    const PaymentTransaction = require('./PaymentTransactionImpl');
    await PaymentTransaction.create({
      checkoutRequestId: 'TX-123',
      userId: 'user-1',
      amount: 120,
      phone: '0712345678',
    });

    delete require.cache[require.resolve('./PaymentTransactionImpl')];
    const ReloadedPaymentTransaction = require('./PaymentTransactionImpl');
    const persistedTransaction = await ReloadedPaymentTransaction.findByCheckoutRequestId('TX-123');

    expect(persistedTransaction).not.toBeNull();
    expect(persistedTransaction.checkoutRequestId).toBe('TX-123');
    expect(persistedTransaction.userId).toBe('user-1');
  });
});
