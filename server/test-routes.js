console.log('Testing route imports...\n');
require('dotenv').config();

try {
  console.log('1. Testing authRoutes...');
  const authRoutes = require('./src/routes/authRoutes');
  console.log('✅ authRoutes loaded');

  console.log('2. Testing taskRoutes...');
  const taskRoutes = require('./src/routes/taskRoutes');
  console.log('✅ taskRoutes loaded');

  console.log('3. Testing walletRoutes...');
  const walletRoutes = require('./src/routes/walletRoutes');
  console.log('✅ walletRoutes loaded');

  console.log('4. Testing evidenceRoutes...');
  const evidenceRoutes = require('./src/routes/evidenceRoutes');
  console.log('✅ evidenceRoutes loaded');

  console.log('5. Testing judgementRoutes...');
  const judgementRoutes = require('./src/routes/judgementRoutes');
  console.log('✅ judgementRoutes loaded');

  console.log('6. Testing friendRoutes...');
  const friendRoutes = require('./src/routes/friendRoutes');
  console.log('✅ friendRoutes loaded');

  console.log('\n✅ All routes loaded successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
