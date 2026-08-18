require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const pushService = require('./services/pushService');

// ========== STARTUP BANNER ==========
const startupTime = new Date().toISOString();
const BUILD_ID = '56c3e0f-force-redeploy-final';
console.log('\n' + '='.repeat(80));
console.log(`🚀 BACKEND STARTUP - ${startupTime}`);
console.log(`   BUILD_ID: ${BUILD_ID}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   Payment Provider: ${process.env.PAYMENT_PROVIDER || 'daraja'}`);
console.log(`   Daraja Configured: ${Boolean(process.env.DARAJA_CONSUMER_KEY && process.env.DARAJA_CONSUMER_SECRET && process.env.DARAJA_CALLBACK_URL)}`);
console.log('='.repeat(80) + '\n');

// Force flush stdout immediately
process.stdout.write(`[${startupTime}] Backend is initializing...\n`);
// ===================================

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';


app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration (Best Practice + Enhanced Logging)
const corsConfig = require('./utils/corsConfig');

// Log every incoming request's Origin header
app.use((req, res, next) => {
  if (req.headers.origin) {
    console.log(`[CORS DEBUG] Incoming request Origin: ${req.headers.origin}`);
  }
  next();
});

app.use(cors(corsConfig));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    buildVersion: BUILD_ID,
    startupTime: startupTime,
    nodeEnv: process.env.NODE_ENV,
    paymentProvider: process.env.PAYMENT_PROVIDER || 'daraja',
    darajaConfigured: Boolean(process.env.DARAJA_CONSUMER_KEY && process.env.DARAJA_CONSUMER_SECRET && process.env.DARAJA_CALLBACK_URL),
    services: {
      push: pushService.isEnabled(),
    },
  });
});

// Test endpoint to verify payment error handling
app.post('/api/test/payment-error', (req, res) => {
  const { message } = req.body;
  const testMessage = message || 'Failed to authenticate with M-Pesa. Please ensure your phone number is correct and try again.';

  console.log('[TEST] Simulating payment error:', testMessage);

  const lowerMsg = testMessage.toLowerCase();
  let finalMessage = testMessage;

  if (/failed\s+to\s+authenticate|authenticat|credential|unauthorized|401|403|auth.*fail|failed.*auth/.test(lowerMsg)) {
    finalMessage = 'Payment authentication failed. Please try again or contact support.';
  } else if (/invalid.*phone|phone.*invalid|invalid.*number|number.*invalid/.test(lowerMsg)) {
    finalMessage = 'Payment failed. Please review your phone number and try again.';
  }

  res.status(200).json({
    originalMessage: testMessage,
    processedMessage: finalMessage,
    wouldBeAccepted: finalMessage !== testMessage,
  });
});

// Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

  // Configure Web Push VAPID
  const pushConfigured = pushService.configure();
  if (pushConfigured) {
    console.log('🔔 Web Push configured');

    // Send an early reminder after startup, then continue hourly.
    setTimeout(() => {
      pushService.broadcastHourlyReminder().catch((error) => {
        console.warn('[Push Scheduler] Immediate reminder failed:', error.message);
      });
    }, 2 * 60 * 1000);

    // Hourly push notification scheduler
    setInterval(() => {
      pushService.broadcastHourlyReminder().catch((error) => {
        console.warn('[Push Scheduler] Hourly reminder failed:', error.message);
      });
    }, 60 * 60 * 1000); // every 60 minutes
  } else {
    console.warn('🔕 Web Push disabled');
  }
});

module.exports = server;
