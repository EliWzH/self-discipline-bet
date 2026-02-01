console.log('Testing middleware and dependencies...\n');
require('dotenv').config();

try {
  console.log('1. Testing express...');
  const express = require('express');
  console.log('✅ express loaded');

  console.log('2. Testing cors...');
  const cors = require('cors');
  console.log('✅ cors loaded');

  console.log('3. Testing path...');
  const path = require('path');
  console.log('✅ path loaded');

  console.log('4. Testing express-rate-limit...');
  const rateLimit = require('express-rate-limit');
  console.log('✅ express-rate-limit loaded');

  console.log('5. Testing errorHandler...');
  const { errorHandler } = require('./src/middleware/errorHandler');
  console.log('✅ errorHandler loaded');

  console.log('6. Creating express app...');
  const app = express();
  console.log('✅ Express app created');

  console.log('7. Applying middleware...');
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ Middleware applied');

  console.log('\n✅ All middleware loaded successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
