#!/usr/bin/env node
/**
 * Comprehensive HashBack API Endpoint Discovery
 * Tries all common endpoint patterns to find working auth and payment endpoints
 */

const https = require('https');

const API_KEY = process.env.HASHPAY_API_KEY || 'HP033869';
const API_SECRET = process.env.HASHPAY_API_SECRET || 'h26419WyK6vAK';
const BASE_URL = 'https://api.hashback.co.ke';

const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

// Common endpoint patterns to test
const ENDPOINTS = {
  auth: [
    '/token',
    '/auth/token',
    '/api/token',
    '/api/auth/token',
    '/oauth/token',
    '/oauth2/token',
    '/v1/auth/token',
    '/v1/token',
    '/v2/auth/token',
    '/v2/token',
    '/authentication/token',
    '/authorization/token',
  ],
  stk: [
    '/stk-push',
    '/stk',
    '/stk/push',
    '/api/stk-push',
    '/api/stk',
    '/api/stk/push',
    '/v1/stk-push',
    '/v1/stk',
    '/v2/stk-push',
    '/v2/stk',
    '/payment/initiate',
    '/payments/initiate',
    '/checkout',
    '/stkpush',
  ],
  status: [
    '/status',
    '/payment/status',
    '/payments/status',
    '/api/status',
    '/api/payment/status',
    '/v1/status',
    '/v1/payment/status',
    '/check-status',
  ],
};

function makeRequest(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE_URL}${path}`);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          data = data ? JSON.parse(data) : {};
        } catch (e) {
          data = { raw: data };
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function testEndpoint(type, path) {
  const method = 'POST';
  const body = {
    phone: '254700123456',
    amount: 100,
  };

  const result = await makeRequest(method, path, body);

  // Interesting responses (not 404)
  if (result.status !== 404) {
    return { path, status: result.status, body: result.body };
  }
  return null;
}

async function discover() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 HASHBACK API ENDPOINT DISCOVERY');
  console.log('='.repeat(70) + '\n');

  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log(`🔑 Credentials: ${API_KEY}:${API_SECRET.substring(0, 5)}...\n`);

  for (const [type, paths] of Object.entries(ENDPOINTS)) {
    console.log(`\n${type.toUpperCase()} ENDPOINTS:`);
    console.log('-'.repeat(70));

    const found = [];
    for (const path of paths) {
      const result = await testEndpoint(type, path);
      if (result) {
        found.push(result);
        console.log(`✅ ${path} [HTTP ${result.status}]`);
        if (result.body && Object.keys(result.body).length > 0) {
          console.log(`   Response: ${JSON.stringify(result.body).substring(0, 100)}...`);
        }
      }
    }

    if (found.length === 0) {
      console.log('❌ No working endpoints found');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 SUMMARY');
  console.log('='.repeat(70));
  console.log('\nShare these findings with support:');
  console.log('- Any ✅ responses indicate potentially valid endpoints');
  console.log('- Check the HTTP status codes and response formats\n');
}

discover().catch(console.error);
