require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');
const Evidence = require('./src/models/Evidence');

const resetUserData = async () => {
  try {
    console.log('🔄 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    const email = 'niyouqian021@gmail.com';
    console.log(`\n📧 查找用户: ${email}`);

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ 用户不存在');
      process.exit(1);
    }
    console.log(`✅ 找到用户: ${user.username} (ID: ${user._id})`);

    // 1. 删除该用户创建的所有任务
    console.log('\n🗑️  删除任务...');
    const deletedTasks = await Task.deleteMany({ userId: user._id });
    console.log(`✅ 删除了 ${deletedTasks.deletedCount} 个任务`);

    // 2. 删除该用户的证据
    console.log('\n🗑️  删除证据...');
    const deletedEvidence = await Evidence.deleteMany({ taskId: { $in: await Task.find({ userId: user._id }).distinct('_id') } });
    console.log(`✅ 删除了 ${deletedEvidence.deletedCount} 条证据记录`);

    // 3. 重置钱包余额
    console.log('\n💰 重置钱包余额...');
    const wallet = await Wallet.findOne({ userId: user._id });
    if (wallet) {
      wallet.balance = 1000;
      wallet.lockedAmount = 0;
      wallet.totalDeposited = 1000;
      wallet.totalDonated = 0;
      wallet.transactions = [{
        type: '充值',
        amount: 1000,
        description: '账户重置 - 初始余额',
        timestamp: new Date()
      }];
      await wallet.save();
      console.log('✅ 钱包余额已重置为 ¥1000');
    } else {
      console.log('⚠️  未找到钱包');
    }

    console.log('\n✅ 用户数据重置完成！');
    console.log(`📊 最终状态：`);
    console.log(`   - 任务数量: 0`);
    console.log(`   - 钱包余额: ¥1000`);
    console.log(`   - 锁定金额: ¥0`);
    console.log(`   - 可用余额: ¥1000`);

    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetUserData();
