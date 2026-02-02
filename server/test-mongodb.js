require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== MongoDB 连接诊断 ===\n');

const uri = process.env.MONGODB_URI;
console.log('1. 检查连接字符串:');
console.log('   完整 URI:', uri);
console.log('');

// 解析连接字符串
const uriMatch = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
if (uriMatch) {
  const [, username, password, cluster, dbName] = uriMatch;
  console.log('2. 连接信息:');
  console.log('   用户名:', username);
  console.log('   密码:', password);
  console.log('   集群:', cluster);
  console.log('   数据库:', dbName.split('?')[0]);
  console.log('');
}

console.log('3. 尝试连接...');
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('   ✅ 连接成功！');
  console.log('   数据库状态:', mongoose.connection.readyState);
  mongoose.connection.close();
  process.exit(0);
})
.catch((err) => {
  console.log('   ❌ 连接失败');
  console.log('');
  console.log('4. 错误详情:');
  console.log('   错误代码:', err.code);
  console.log('   错误名称:', err.codeName);
  console.log('   错误信息:', err.message);
  console.log('');
  console.log('5. 可能的原因:');
  
  if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
    console.log('   ⚠️  认证失败 - 用户名或密码错误');
    console.log('   解决方案:');
    console.log('   1. 登录 MongoDB Atlas (https://cloud.mongodb.com)');
    console.log('   2. 进入 Database Access 页面');
    console.log('   3. 检查用户是否存在');
    console.log('   4. 如果密码有特殊字符，需要进行 URL 编码');
    console.log('   5. 或者删除旧用户，创建新用户');
  } else if (err.message.includes('IP') || err.message.includes('whitelist')) {
    console.log('   ⚠️  IP 地址未加入白名单');
    console.log('   解决方案:');
    console.log('   1. 登录 MongoDB Atlas');
    console.log('   2. 进入 Network Access 页面');
    console.log('   3. 添加当前 IP 或允许所有 IP (0.0.0.0/0)');
  }
  
  process.exit(1);
});

setTimeout(() => {
  console.log('   ⏱️  连接超时（10秒）');
  process.exit(1);
}, 11000);
