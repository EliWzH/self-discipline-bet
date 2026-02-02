require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('./src/models/Wallet');
const Task = require('./src/models/Task');
const Evidence = require('./src/models/Evidence');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI;
console.log('连接到数据库...');
console.log('MongoDB URI:', MONGODB_URI ? '已配置' : '未配置');

async function resetAllData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库');

    // 1. 删除所有证据
    const evidenceResult = await Evidence.deleteMany({});
    console.log(`\n✅ 已删除 ${evidenceResult.deletedCount} 条证据记录`);

    // 2. 删除所有任务
    const taskResult = await Task.deleteMany({});
    console.log(`✅ 已删除 ${taskResult.deletedCount} 个任务`);

    // 3. 重置所有钱包
    const wallets = await Wallet.find({});
    console.log(`\n找到 ${wallets.length} 个钱包，开始重置...`);

    for (const wallet of wallets) {
      console.log(`\n重置钱包: ${wallet.userId}`);
      console.log(`  旧余额: ${wallet.balance}`);
      console.log(`  旧锁定: ${wallet.lockedAmount}`);
      console.log(`  旧捐赠: ${wallet.totalDonated}`);

      // 重置为初始状态
      wallet.balance = 1000;
      wallet.lockedAmount = 0;
      wallet.totalDeposited = 1000;
      wallet.totalDonated = 0;
      wallet.transactions = [{
        type: '充值',
        amount: 1000,
        description: '系统重置 - 初始余额',
        timestamp: new Date()
      }];

      await wallet.save();
      console.log(`  ✅ 新余额: 1000, 锁定: 0, 捐赠: 0`);
    }

    console.log('\n🎉 所有数据已重置！');
    console.log('📊 统计:');
    console.log(`  - 删除了 ${taskResult.deletedCount} 个任务`);
    console.log(`  - 删除了 ${evidenceResult.deletedCount} 条证据`);
    console.log(`  - 重置了 ${wallets.length} 个钱包`);
    console.log('  - 所有用户余额: ¥1000');
    console.log('  - 所有锁定金额: ¥0');

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

resetAllData();
