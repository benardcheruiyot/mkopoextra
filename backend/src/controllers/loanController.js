// Loan Controller
const Loan = require('../models/Loan');
const PaymentTransaction = require('../models/PaymentTransaction');
const loanService = require('../services/loanService');
const paymentService = require('../services/paymentService');
const { AppError } = require('../middleware/errorHandler');
const pushService = require('../services/pushService');

const STATUS_QUERY_MIN_INTERVAL_MS = 1200;
const TERMINAL_STATUS_GRACE_MS = 25000;

class LoanController {
  constructor() {
    this.createApplication = this.createApplication.bind(this);
    this.getLoan = this.getLoan.bind(this);
    this.getUserLoans = this.getUserLoans.bind(this);
    this.getLastTransaction = this.getLastTransaction.bind(this);
    this.initiatePayment = this.initiatePayment.bind(this);
    this.checkPaymentStatus = this.checkPaymentStatus.bind(this);
    this.handlePaymentCallback = this.handlePaymentCallback.bind(this);
    this.appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  inferLoanAmountFromFee(processingFee) {
    const feeToLoanMap = {
      120: 5500,
      200: 10000,
      320: 15000,
      520: 25000,
      760: 35000,
      1100: 50000,
      1450: 65000,
      1850: 80000,
      2350: 100000,
      2800: 120000,
      3200: 135000,
      3500: 150000,
    };

    return feeToLoanMap[Number(processingFee)] || null;
  }

  async ensureLoanCreatedForCompletedTransaction(checkoutRequestId) {
    if (!checkoutRequestId) return null;

    const transaction = await PaymentTransaction.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction || transaction.status !== 'completed' || transaction.loanId) {
      return transaction;
    }

    if (!transaction.userId || !transaction.loanAmount) {
      return transaction;
    }

    const loan = await loanService.createLoanApplication(transaction.userId, {
      amount: Number(transaction.loanAmount),
      processingFee: Number(transaction.amount),
      termDays: Number(transaction.termDays) || 60,
    });

    await PaymentTransaction.updateByCheckoutRequestId(checkoutRequestId, {
      loanId: loan.id,
      loanCreatedAt: new Date(),
    });

    return PaymentTransaction.findByCheckoutRequestId(checkoutRequestId);
  }

  async createApplication(req, res, next) {
    try {
      const { amount, termDays } = req.body;

      if (!amount) {
        return next(new AppError('Loan amount is required', 400));
      }

      // Validate amount
      loanService.validateLoanAmount(amount);

      const processingFee = parseInt(process.env.PROCESSING_FEE || 300, 10);

      const loan = await loanService.createLoanApplication(req.user.id, {
        amount,
        processingFee,
        termDays: termDays || 30,
      });

      res.status(201).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const loan = await Loan.findById(loanId);

      if (!loan) {
        return next(new AppError('Loan not found', 404));
      }

      if (loan.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this loan', 403));
      }

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getUserLoans(req, res, next) {
    try {
      const loans = await Loan.findByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getLastTransaction(req, res, next) {
    try {
      const lastTransaction = await PaymentTransaction.findLastByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: lastTransaction
          ? {
              checkoutRequestId: lastTransaction.checkoutRequestId,
              amount: lastTransaction.amount,
              loanAmount: lastTransaction.loanAmount,
              termDays: lastTransaction.termDays,
              phone: lastTransaction.phone,
              status: lastTransaction.status,
              createdAt: lastTransaction.createdAt,
            }
          : null,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async initiatePayment(req, res, next) {
    try {
      const { phone, amount, loanAmount, termDays } = req.body;

      if (!phone || !amount) {
        return next(new AppError('Phone number and amount are required', 400));
      }

      loanService.validateProcessingFee(Number(amount));

      const resolvedLoanAmount = Number(loanAmount) || this.inferLoanAmountFromFee(amount);
      if (resolvedLoanAmount) {
        loanService.validateLoanAmount(Number(resolvedLoanAmount));
      }

      const result = await paymentService.initiatePayment(phone, amount);

      if (!result.success) {
        let finalMessage = result.message || 'Payment processing failed';

        console.error('[Controller] ❌ PAYMENT FAILED');
        console.error('[Controller]   Original from provider:', finalMessage);

        // HARD RULE: Auth failures NEVER become phone-number errors
        const lowerMsg = String(finalMessage).toLowerCase();
        
        // Check 1: Is this an auth/credential failure?
        // Explicitly handles: "Failed to authenticate with M-Pesa. Please ensure your phone number..."
        if (/authenticat|credential|unauthorized|401|403|auth.*fail|failed.*auth|failed.*to.*authenticate/.test(lowerMsg)) {
          finalMessage = 'Payment authentication failed. Please try again or contact support.';
          console.error('[Controller]   ✅ DETECTED: AUTH FAILURE -> returning auth message');
        }
        // Check 2: Is this actually an invalid phone number error?
        else if (/invalid.*phone|phone.*invalid|invalid.*number|number.*invalid/.test(lowerMsg)) {
          finalMessage = 'Payment failed. Please review your phone number and try again.';
          console.error('[Controller]   ✅ DETECTED: INVALID PHONE -> returning phone message');
        }
        // Check 3: Generic error
        else if (/error|failed|invalid/.test(lowerMsg)) {
          finalMessage = 'Payment processing failed. Please try again.';
          console.error('[Controller]   ✅ DETECTED: GENERIC ERROR -> returning generic message');
        }
        
        console.error('[Controller]   Final message:', finalMessage);
        return next(new AppError(finalMessage, 400));
      }

      await PaymentTransaction.create({
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        userId: req.user.id,
        phone,
        amount,
        loanAmount: resolvedLoanAmount,
        termDays: termDays || 60,
        status: 'initiated',
        rawResponse: result.rawResponse || null,
      });

      res.status(200).json({
        success: true,
        reference: result.checkoutRequestId,
      });

      // Notify device that payment request was sent
      pushService.sendToUser(req.user.id, {
        title: 'Check Your Phone',
        body: `Payment request of KES ${amount} sent. Confirm it on your phone.`,
        icon: '/favicon.ico',
        url: this.appUrl,
      }).catch(() => {});
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async checkPaymentStatus(req, res, next) {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');

      const { checkoutId } = req.query;

      if (!checkoutId) {
        return next(new AppError('Checkout ID is required', 400));
      }

      console.log(`[Payment Status] Checking status for checkoutId: ${checkoutId}`);

      const existingTransaction = await PaymentTransaction.findByCheckoutRequestId(checkoutId);
      console.log(
        '[Payment Status] Transaction found:',
        existingTransaction ? 'yes' : 'no',
        existingTransaction?.status
      );

      if (existingTransaction?.userId && existingTransaction.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this transaction', 403));
      }

      const terminalStatuses = ['completed', 'failed', 'cancelled', 'expired'];

      // Prefer callback-confirmed terminal state to avoid losing a successful payment
      // when an STK query response is delayed or temporarily inconsistent.
      if (existingTransaction && terminalStatuses.includes(existingTransaction.status)) {
        console.log(`[Payment Status] Transaction already in terminal state: ${existingTransaction.status}`);
        const finalizedTransaction =
          existingTransaction.status === 'completed'
            ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
            : existingTransaction;

        return res.status(200).json({
          success: finalizedTransaction.status === 'completed',
          status: finalizedTransaction.status,
          resultCode: finalizedTransaction.resultCode || null,
          resultDescription: finalizedTransaction.resultDescription || null,
          loanId: finalizedTransaction.loanId || null,
        });
      }

      // Return quickly for active transactions and only query the configured payment provider at controlled intervals.
      // This keeps UI polling responsive while still allowing callback-confirmed states to surface instantly.
      if (existingTransaction && !terminalStatuses.includes(existingTransaction.status)) {
        const lastQueryMs = existingTransaction.lastStatusQueryAt
          ? new Date(existingTransaction.lastStatusQueryAt).getTime()
          : 0;
        const elapsedSinceLastQuery = Date.now() - lastQueryMs;

        if (lastQueryMs > 0 && elapsedSinceLastQuery < STATUS_QUERY_MIN_INTERVAL_MS) {
          return res.status(200).json({
            success: false,
            status: existingTransaction.status || 'pending',
            resultCode: existingTransaction.resultCode || null,
            resultDescription: existingTransaction.resultDescription || 'Waiting for payment confirmation...',
            loanId: existingTransaction.loanId || null,
          });
        }
      }

      console.log('[Payment Status] Querying payment provider for transaction status...');
      const result = await paymentService.checkPaymentStatus(checkoutId);
      console.log('[Payment Status] Payment status result:', result.status);

      const refreshedTransaction = await PaymentTransaction.findByCheckoutRequestId(checkoutId);
      const fallbackStatus = refreshedTransaction?.status || existingTransaction?.status || 'pending';
      let normalizedStatus = result.status || fallbackStatus;

      const queryTerminalStatuses = ['failed', 'cancelled', 'expired'];
      const statusSourceTransaction = refreshedTransaction || existingTransaction;
      const transactionAgeMs = statusSourceTransaction?.createdAt
        ? Date.now() - new Date(statusSourceTransaction.createdAt).getTime()
        : Number.POSITIVE_INFINITY;
      const callbackConfirmed = Boolean(statusSourceTransaction?.callbackData);

      // Some STK status queries can briefly return terminal states before the user finishes
      // handset confirmation. Keep polling as pending for a short grace window unless callback-confirmed.
      if (
        queryTerminalStatuses.includes(normalizedStatus) &&
        !callbackConfirmed &&
        transactionAgeMs < TERMINAL_STATUS_GRACE_MS
      ) {
        console.log(
          `[Check Status] Holding early terminal result as pending (${normalizedStatus}) at ${transactionAgeMs}ms`
        );
        normalizedStatus = 'pending';
      }

      console.log(`[Check Status] Normalized status: ${normalizedStatus}`);

      // Update the transaction with the latest status
      if (existingTransaction || refreshedTransaction) {
        console.log('[Check Status] Updating transaction status...');
        await PaymentTransaction.updateByCheckoutRequestId(checkoutId, {
          status: normalizedStatus,
          resultCode: normalizedStatus === 'pending' ? null : (result.resultCode || null),
          resultDescription:
            normalizedStatus === 'pending'
              ? 'Waiting for payment confirmation...'
              : (result.resultDescription || null),
          lastStatusQueryAt: new Date(),
        });
      } else if (normalizedStatus === 'completed') {
        // If we confirmed payment is completed but no transaction exists, create one
        console.log('[Check Status] Payment confirmed but no transaction exists. Creating new record.');
        await PaymentTransaction.create({
          checkoutRequestId: checkoutId,
          status: 'completed',
          resultCode: result.resultCode || '0',
          resultDescription: result.resultDescription || 'Payment confirmed',
        });
      }

      const finalizedTransaction =
        normalizedStatus === 'completed'
          ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
          : await PaymentTransaction.findByCheckoutRequestId(checkoutId);

      console.log(
        `[Check Status] Final response: success=${normalizedStatus === 'completed'}, status=${normalizedStatus}`
      );

      res.status(200).json({
        success: normalizedStatus === 'completed',
        status: normalizedStatus,
        resultCode: result.resultCode || refreshedTransaction?.resultCode || null,
        resultDescription:
          normalizedStatus === 'expired'
            ? 'Transaction expired after 5 minutes without confirmation.'
            : result.resultDescription || refreshedTransaction?.resultDescription || null,
        loanId: finalizedTransaction?.loanId || null,
      });
    } catch (error) {
      console.error('[Check Status] Error:', error.message, error.stack);
      return res.status(200).json({
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: 'Payment confirmation is delayed. Please keep waiting.',
        loanId: null,
      });
    }
  }

  async handlePaymentCallback(req, res, next) {
    try {
      const payload = req.body;
      const callbackPayload = paymentService.parseCallback(payload);
      if (!callbackPayload || !callbackPayload.transactionId) {
        console.error('[Callback] Invalid callback data received');
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data',
        });
      }

      const {
        transactionId,
        merchantRequestId,
        status,
        resultCode,
        resultDescription,
        receiptNumber,
        callbackData,
      } = callbackPayload;

      console.log(`[Callback] Received callback for transactionId: ${transactionId}, status: ${status}`);

      let existingTransaction = await PaymentTransaction.findByCheckoutRequestId(transactionId);

      if (!existingTransaction) {
        console.warn(`[Callback] Transaction not found for ${transactionId}. Creating new record.`);
        existingTransaction = await PaymentTransaction.create({
          checkoutRequestId: transactionId,
          merchantRequestId: merchantRequestId || null,
          status: status || 'failed',
          resultCode: resultCode || null,
          resultDescription: resultDescription || null,
          receiptNumber: receiptNumber || null,
          callbackData: callbackData || payload,
        });
      } else {
        await PaymentTransaction.updateByCheckoutRequestId(transactionId, {
          merchantRequestId: merchantRequestId || null,
          status: status || existingTransaction.status,
          resultCode: resultCode || existingTransaction.resultCode,
          resultDescription: resultDescription || existingTransaction.resultDescription,
          receiptNumber: receiptNumber || existingTransaction.receiptNumber || existingTransaction.providerReceiptNumber,
          callbackData: callbackData || payload,
        });
      }

      if (status === 'completed') {
        const finalTx = await this.ensureLoanCreatedForCompletedTransaction(transactionId);
        console.log(`Payment successful for request: ${transactionId}`);

        const userId = existingTransaction?.userId || finalTx?.userId;
        if (userId) {
          pushService.sendToUser(userId, {
            title: 'Payment Received!',
            body: 'Your payment was confirmed. Your loan is being processed.',
            icon: '/favicon.ico',
            url: this.appUrl,
          }).catch(() => {});
        }
      } else {
        console.log(`Payment failed for request: ${transactionId}, Result: ${resultDescription}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Callback] Error processing callback:', error.message);
      next(new AppError(error.message, 500));
    }
  }
}

module.exports = new LoanController();
