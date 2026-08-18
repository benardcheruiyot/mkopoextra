#!/usr/bin/env node

/**
 * Payment Provider Configuration Helper
 * Interactive script to set up Hashpay backend credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function main() {
  console.log('\n🚀 Hashpay Configuration Setup\n');
  console.log('This script configures production Hashpay credentials only.\n');
  await setupProduction();
}

async function setupProduction() {
  console.log('\n🔐 Production Configuration\n');
  console.log('⚠️  IMPORTANT: This will update your .env file with production credentials\n');

  const envPath = path.join(__dirname, '.env');

  const apiKey = await question(
    'Enter your HASHPAY_API_KEY: '
  );
  const apiSecret = await question(
    'Enter your HASHPAY_API_SECRET: '
  );
  const callbackUrl = await question(
    'Enter your HASHPAY_CALLBACK_URL (e.g., https://yourdomain.com/api/payments/callback): '
  );
  const frontendUrl = await question(
    'Enter your FRONTEND_URL (e.g., https://yourdomain.com): '
  );
  const mongoUri = await question(
    'Enter your MONGODB_URI (MongoDB Atlas connection string): '
  );

  // Generate JWT secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(32).toString('hex');

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update environment variables
  envContent = updateEnvVar(envContent, 'NODE_ENV', 'production');
  envContent = updateEnvVar(envContent, 'PAYMENT_PROVIDER', 'hashpay');
  envContent = updateEnvVar(envContent, 'HASHPAY_API_KEY', apiKey);
  envContent = updateEnvVar(envContent, 'HASHPAY_API_SECRET', apiSecret);
  envContent = updateEnvVar(envContent, 'HASHPAY_ENVIRONMENT', 'production');
  envContent = updateEnvVar(envContent, 'HASHPAY_BASE_URL', 'https://api.hashpay.co.ke');
  envContent = updateEnvVar(envContent, 'HASHPAY_CALLBACK_URL', callbackUrl);
  envContent = updateEnvVar(envContent, 'FRONTEND_URL', frontendUrl);
  envContent = updateEnvVar(envContent, 'MONGODB_URI', mongoUri);
  envContent = updateEnvVar(envContent, 'JWT_SECRET', jwtSecret);

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Production configuration saved to .env\n');
  console.log('Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test payment flow');
  console.log('3. Monitor Hashpay dashboard or provider notifications for transactions\n');

  rl.close();
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

main().catch(console.error);
