require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugUserTasks(emailOrUsername) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库\n');

    // 查找用户
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      console.log('❌ 未找到用户:', emailOrUsername);
      process.exit(1);
    }

    console.log('👤 用户信息:');
    console.log(`   用户名: ${user.username}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   ID: ${user._id}\n`);

    // 查找用户的所有任务
    const tasks = await Task.find({ userId: user._id })
      .populate('judgeUserId', 'username email')
      .sort({ createdAt: -1 });

    console.log(`📋 找到 ${tasks.length} 个任务:\n`);

    tasks.forEach((task, index) => {
      console.log(`任务 ${index + 1}:`);
      console.log(`   标题: ${task.title}`);
      console.log(`   状态: ${task.status}`);
      console.log(`   赌注: ¥${task.betAmount}`);
      console.log(`   截止时间: ${task.deadline}`);
      console.log(`   是否过期: ${new Date() > new Date(task.deadline) ? '是' : '否'}`);
      console.log(`   审判者: ${task.judgeUserId?.username || '无'}`);
      console.log(`   审判状态: ${task.judgeStatus || '无'}`);
      console.log(`   是否模板: ${task.templateTask ? '是' : '否'}`);
      console.log(`   创建时间: ${task.createdAt}`);
      console.log('');
    });

    // 检查钱包
    const wallet = await Wallet.findOne({ userId: user._id });
    if (wallet) {
      console.log('💰 钱包信息:');
      console.log(`   余额: ¥${wallet.balance} (类型: ${typeof wallet.balance})`);
      console.log(`   锁定: ¥${wallet.lockedAmount} (类型: ${typeof wallet.lockedAmount})`);
      console.log(`   捐赠: ¥${wallet.totalDonated}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

const emailOrUsername = process.argv[2];
if (!emailOrUsername) {
  console.log('用法: node debug-user-tasks.js <email或username>');
  console.log('例如: node debug-user-tasks.js user@example.com');
  process.exit(1);
}

debugUserTasks(emailOrUsername);
