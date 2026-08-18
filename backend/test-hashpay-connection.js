#!/usr/bin/env node
/**
 * Diagnostic Script: Test Hashpay API Connection
 * Validates credentials and API endpoints before payment processing
 */

require('dotenv').config();
const https = require('https');

const config = {
  apiKey: process.env.HASHPAY_API_KEY,
  apiSecret: process.env.HASHPAY_API_SECRET,
  baseUrl: process.env.HASHPAY_BASE_URL || 'https://api.hashpay.co.ke',
  callbackUrl: process.env.HASHPAY_CALLBACK_URL,
  environment: process.env.HASHPAY_ENVIRONMENT || 'production',
};

console.log('\n' + '='.repeat(70));
console.log('🔍 HASHPAY CONFIGURATION DIAGNOSTIC');
console.log('='.repeat(70) + '\n');

console.log('📋 Configuration Check:');
console.log(`  ✓ API Key: ${config.apiKey ? '✅ SET' : '❌ MISSING'} ${config.apiKey ? `(${config.apiKey.substring(0, 5)}...)` : ''}`);
console.log(`  ✓ API Secret: ${config.apiSecret ? '✅ SET' : '❌ MISSING'} ${config.apiSecret ? `(${config.apiSecret.substring(0, 5)}...)` : ''}`);
console.log(`  ✓ Base URL: ${config.baseUrl}`);
console.log(`  ✓ Environment: ${config.environment}`);
console.log(`  ✓ Callback URL: ${config.callbackUrl ? '✅ SET' : '❌ MISSING'}`);

if (!config.apiKey || !config.apiSecret) {
  console.error('\n❌ CRITICAL: API Key or Secret missing. Cannot proceed.');
  process.exit(1);
}

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseUrl}${path}`);
    
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    };

    console.log(`\n🔄 Request: ${method} ${path}`);
    
    const request = https.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          data = data ? JSON.parse(data) : {};
        } catch (e) {
          data = data;
        }
        resolve({ status: response.statusCode, data });
      });
    });

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function testConnection() {
  try {
    // Test 1: Get Access Token
    console.log('\n\n📝 TEST 1: Authentication Token');
    console.log('-'.repeat(70));
    
    const credentials = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');
    const tokenResponse = await makeRequest('POST', '/api/v1/auth/token', {
      'Authorization': `Basic ${credentials}`,
    });

    console.log(`   Status: ${tokenResponse.status}`);
    console.log(`   Response: ${JSON.stringify(tokenResponse.data, null, 2)}`);

    if (tokenResponse.status >= 200 && tokenResponse.status < 300) {
      console.log('   ✅ Authentication successful!');
      return true;
    } else if (tokenResponse.status === 401 || tokenResponse.status === 403) {
      console.log('   ❌ Authentication FAILED: Invalid credentials');
      console.log('      Possible causes:');
      console.log('      - Incorrect API Key or Secret');
      console.log('      - Credentials expired or deactivated');
      console.log('      - Account not authorized for this API');
      return false;
    } else {
      console.log(`   ⚠️  Unexpected status: ${tokenResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Connection Error:', error.message);
    return false;
  }
}

async function testSTKPushEndpoint() {
  try {
    console.log('\n\n📝 TEST 2: STK Push Endpoint');
    console.log('-'.repeat(70));
    
    const credentials = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');
    const payload = {
      phone: '254700000000', // Test phone number
      amount: 100,
      checkout_request_id: `TEST-${Date.now()}`,
      merchant_request_id: `MERCHANT-${Date.now()}`,
      callback_url: config.callbackUrl,
    };

    const response = await makeRequest('POST', '/api/v1/stk-push', {
      'Authorization': `Basic ${credentials}`,
    }, payload);

    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);

    if (response.status >= 200 && response.status < 300) {
      console.log('   ✅ STK Push endpoint accessible!');
    } else if (response.status === 401 || response.status === 403) {
      console.log('   ❌ Authentication failed on STK endpoint');
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
  } catch (error) {
    console.error('   ❌ Request Error:', error.message);
  }
}

async function run() {
  const authSuccess = await testConnection();
  
  if (authSuccess) {
    await testSTKPushEndpoint();
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Diagnostic Complete');
  console.log('='.repeat(70) + '\n');
}

run().catch(console.error);
