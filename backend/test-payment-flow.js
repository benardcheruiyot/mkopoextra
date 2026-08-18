#!/usr/bin/env node
/**
 * Payment Flow Tester
 * Simulates user registration → loan application → payment initiation
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          data = data ? JSON.parse(data) : {};
        } catch (e) {
          data = data;
        }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testPaymentFlow() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PAYMENT FLOW TEST - M-Pesa Authentication');
  console.log('='.repeat(70) + '\n');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Register/Login User
    console.log('📝 Step 1: Register/Login User');
    console.log('-'.repeat(70));
    
    const registerRes = await makeRequest('POST', '/auth/register', {
      phone_number: '254700123456',
      name: 'Test User',
    });

    console.log(`   Status: ${registerRes.status}`);
    console.log(`   Response: ${JSON.stringify(registerRes.data, null, 2)}`);

    if (registerRes.status !== 200 && registerRes.status !== 201) {
      throw new Error(`Registration failed: ${registerRes.status}`);
    }

    authToken = registerRes.data.data?.token;
    userId = registerRes.data.data?.user?.id;

    console.log(`   ✅ User registered. Token: ${authToken?.substring(0, 20)}...`);
    console.log(`   ✅ User ID: ${userId}\n`);

    // Step 2: Apply for Loan
    console.log('📝 Step 2: Apply for Loan');
    console.log('-'.repeat(70));

    const loanRes = await makeRequest('POST', '/loans/apply', {
      amount: 10000,
      termDays: 30,
    }, {
      'Authorization': `Bearer ${authToken}`,
    });

    console.log(`   Status: ${loanRes.status}`);
    console.log(`   Response: ${JSON.stringify(loanRes.data, null, 2)}`);

    if (loanRes.status !== 201 && loanRes.status !== 200) {
      console.log(`   ⚠️  Loan application may have failed (status ${loanRes.status})`);
    } else {
      console.log(`   ✅ Loan application created\n`);
    }

    // Step 3: Initiate Payment (THE CRITICAL TEST)
    console.log('📝 Step 3: Initiate Payment (M-Pesa STK Push)');
    console.log('-'.repeat(70));

    const paymentRes = await makeRequest('POST', '/payments/initiate', {
      phone: '254700123456',
      amount: 120,  // Processing fee (valid range: 120-3500)
      loanAmount: 10000,
      termDays: 30,
    }, {
      'Authorization': `Bearer ${authToken}`,
    });

    console.log(`   Status: ${paymentRes.status}`);
    console.log(`   Response: ${JSON.stringify(paymentRes.data, null, 2)}`);

    if (paymentRes.status === 200 && paymentRes.data.success) {
      console.log(`   ✅ Payment initiated successfully!`);
      console.log(`   ✅ Checkout Request ID: ${paymentRes.data.reference}`);
    } else if (paymentRes.status === 400) {
      console.log(`   ❌ Payment initiation FAILED`);
      console.log(`   Error Message: "${paymentRes.data.message}"`);
      
      // Analyze the error
      const errorMsg = String(paymentRes.data.message || '').toLowerCase();
      console.log(`\n🔍 ERROR ANALYSIS:`);
      
      if (/authenticat|credential|unauthorized|auth.*fail/.test(errorMsg)) {
        console.log(`   → This is an AUTHENTICATION error`);
        console.log(`   → Issue: Cannot authenticate with Hashpay`);
        console.log(`   → Check: API Key and Secret in .env`);
        console.log(`   → Check: Hashpay account status and permissions`);
      } else if (/invalid.*phone|phone.*invalid/.test(errorMsg)) {
        console.log(`   → This is a PHONE NUMBER error`);
        console.log(`   → Issue: Phone number format or validation failed`);
        console.log(`   → Expected format: 254XXXXXXXXX (12 digits)`);
      } else if (/amount|fee/.test(errorMsg)) {
        console.log(`   → This is an AMOUNT error`);
        console.log(`   → Issue: Amount is outside valid range (120-3500 KES)`);
      } else {
        console.log(`   → Generic payment error`);
      }
    } else {
      console.log(`   ⚠️  Unexpected response (status ${paymentRes.status})`);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test Complete');
  console.log('='.repeat(70) + '\n');
}

testPaymentFlow().catch(console.error);
