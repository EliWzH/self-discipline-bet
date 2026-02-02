const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    console.log('🔄 正在连接 MongoDB Atlas...');
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000, // 增加到 10 秒
      socketTimeoutMS: 60000, // 增加到 60 秒
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    });
    console.log('✅ MongoDB Atlas 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    console.error('提示: 请检查 MongoDB Atlas 是否在线，以及当前 IP 是否已加入白名单');
    console.warn('⚠️  服务器将在无数据库模式下启动（仅用于开发测试）');
    console.warn('⚠️  部分功能将不可用，需要配置 MongoDB 后才能正常使用');
    // 注释掉 process.exit(1) 允许服务器继续启动
    // process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB 连接已断开');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB 错误:', err);
});

module.exports = connectDB;
