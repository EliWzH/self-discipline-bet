require('dotenv').config();

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: '30d',  // 30天保持登录
    refreshExpiry: '90d'  // 90天刷新token
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-sonnet-4-20250514'
  },
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  }
};
