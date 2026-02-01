require('dotenv').config();
const mongoose = require('mongoose');

console.log('开始测试 MongoDB 连接...');
console.log('URI:', process.env.MONGODB_URI ? '已配置' : '未配置');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB 连接成功！');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error.message);
  console.error('详细错误:', error);
  process.exit(1);
});
