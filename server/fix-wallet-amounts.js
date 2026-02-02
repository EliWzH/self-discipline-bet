const mongoose = require('mongoose');
const Wallet = require('./src/models/Wallet');
const Task = require('./src/models/Task');
const TaskStatus = require('./src/constants/taskStatus');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/self-discipline-bet';

async function fixWalletAmounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库');

    // 获取所有钱包
    const wallets = await Wallet.find({});
    console.log(`\n找到 ${wallets.length} 个钱包`);

    for (const wallet of wallets) {
      console.log(`\n处理钱包: ${wallet.userId}`);
      console.log(`  当前 lockedAmount: ${wallet.lockedAmount} (类型: ${typeof wallet.lockedAmount})`);
      console.log(`  当前 balance: ${wallet.balance} (类型: ${typeof wallet.balance})`);
      console.log(`  当前 totalDonated: ${wallet.totalDonated} (类型: ${typeof wallet.totalDonated})`);

      // 修复：将所有金额转换为数字类型
      wallet.balance = Number(wallet.balance) || 0;
      wallet.totalDonated = Number(wallet.totalDonated) || 0;
      wallet.totalDeposited = Number(wallet.totalDeposited) || 0;

      // 重新计算正确的锁定金额（基于进行中和已提交的任务）
      const activeTasks = await Task.find({
        userId: wallet.userId,
        status: { $in: [TaskStatus.IN_PROGRESS, TaskStatus.SUBMITTED] }
      });

      const correctLockedAmount = activeTasks.reduce((sum, task) => {
        return sum + Number(task.betAmount);
      }, 0);

      console.log(`  进行中/已提交的任务: ${activeTasks.length} 个`);
      console.log(`  重新计算的 lockedAmount: ${correctLockedAmount}`);

      // 更新锁定金额
      wallet.lockedAmount = correctLockedAmount;

      await wallet.save();
      console.log(`  ✅ 已更新钱包`);
    }

    console.log('\n✅ 所有钱包已修复');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

fixWalletAmounts();
