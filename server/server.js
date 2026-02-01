const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/env');

// 启动函数
const startServer = async () => {
  try {
    console.log('🚀 开始启动服务器...');
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接完成');

    // 启动服务器
    const PORT = config.server.port;
    console.log(`📡 准备监听端口 ${PORT}...`);
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🎯 自律赌注平台服务器已启动                           ║
║                                                           ║
║      环境: ${config.server.env.padEnd(45)}║
║      端口: ${PORT.toString().padEnd(45)}║
║      时间: ${new Date().toLocaleString('zh-CN').padEnd(45)}║
║                                                           ║
║      API 地址: http://localhost:${PORT}/api                    ║
║      健康检查: http://localhost:${PORT}/health                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n⚠️  正在关闭服务器...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ 未处理的 Promise 拒绝:', err);
  process.exit(1);
});
