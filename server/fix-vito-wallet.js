require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');
const TaskStatus = require('./src/constants/taskStatus');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixVitoWallet() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库\n');

    // 查找 Vito
    const user = await User.findOne({ email: 'vitokang@outlook.com' });
    if (!user) {
      console.log('❌ 未找到用户');
      process.exit(1);
    }

    console.log('👤 用户: Vito');
    console.log(`   ID: ${user._id}\n`);

    // 查找 Vito 的进行中任务
    const activeTasks = await Task.find({
      userId: user._id,
      status: { $in: [TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED] }
    });

    console.log(`📋 进行中/已提交的任务: ${activeTasks.length} 个\n`);

    // 计算应该锁定的金额
    const correctLockedAmount = activeTasks.reduce((sum, task) => {
      console.log(`   - ${task.title}: ¥${task.betAmount}`);
      return sum + Number(task.betAmount);
    }, 0);

    console.log(`\n💰 应该锁定: ¥${correctLockedAmount}\n`);

    // 更新钱包
    const wallet = await Wallet.findOne({ userId: user._id });
    console.log(`   当前余额: ¥${wallet.balance}`);
    console.log(`   当前锁定: ¥${wallet.lockedAmount}`);
    console.log(`   需要调整: ¥${correctLockedAmount - wallet.lockedAmount}`);

    // 从余额中扣除应该锁定的金额
    const amountToLock = correctLockedAmount - wallet.lockedAmount;
    wallet.balance = Number(wallet.balance) - amountToLock;
    wallet.lockedAmount = correctLockedAmount;

    await wallet.save();

    console.log(`\n✅ 已修复！`);
    console.log(`   新余额: ¥${wallet.balance}`);
    console.log(`   新锁定: ¥${wallet.lockedAmount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

fixVitoWallet();
