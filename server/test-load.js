console.log('1. Starting test...');

try {
  console.log('2. Loading dotenv...');
  require('dotenv').config();
  console.log('3. Dotenv loaded');

  console.log('4. Loading app...');
  const app = require('./src/app');
  console.log('5. App loaded successfully');

  console.log('6. Loading database config...');
  const connectDB = require('./src/config/database');
  console.log('7. Database config loaded');

  console.log('\n✅ All modules loaded successfully!');
  console.log('PORT:', process.env.PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  process.exit(0);
} catch (error) {
  console.error('\n❌ Error loading modules:');
  console.error(error);
  process.exit(1);
}
