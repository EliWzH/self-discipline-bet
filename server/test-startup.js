console.log('=== Testing Server Startup ===');

// 1. Test environment variables
console.log('\n1. Environment Variables:');
require('dotenv').config();
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('   CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✓ Set' : '✗ Missing');

// 2. Test config loading
console.log('\n2. Loading config...');
try {
  const config = require('./src/config/env');
  console.log('   ✓ Config loaded');
  console.log('   Port:', config.server.port);
} catch (e) {
  console.log('   ✗ Config error:', e.message);
  process.exit(1);
}

// 3. Test app loading
console.log('\n3. Loading Express app...');
try {
  const app = require('./src/app');
  console.log('   ✓ App loaded');
  
  // 4. Try to start server
  console.log('\n4. Starting server...');
  const server = app.listen(5001, () => {
    console.log('   ✓ Server started on port 5001');
    
    // 5. Test health endpoint
    setTimeout(() => {
      const http = require('http');
      http.get('http://localhost:5001/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('\n5. Health Check:');
          console.log('   Response:', data);
          server.close();
          console.log('\n=== All Tests Passed ===');
          process.exit(0);
        });
      }).on('error', (err) => {
        console.log('\n5. Health Check: ✗ Failed -', err.message);
        server.close();
        process.exit(1);
      });
    }, 1000);
  });
  
  server.on('error', (err) => {
    console.log('   ✗ Server error:', err.message);
    process.exit(1);
  });
} catch (e) {
  console.log('   ✗ App error:', e.message);
  console.log(e.stack);
  process.exit(1);
}
