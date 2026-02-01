require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Wallet = require('./src/models/Wallet');

const resetWallet = async () => {
  try {
    console.log('🔄 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    const email = 'wangzhenghao16@gmail.com';
    console.log(`\n📧 查找用户: ${email}`);

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ 用户不存在');
      process.exit(1);
    }
    console.log(`✅ 找到用户: ${user.username} (ID: ${user._id})`);

    // 重置钱包余额
    console.log('\n💰 重置钱包余额...');
    const wallet = await Wallet.findOne({ userId: user._id });
    if (wallet) {
      console.log(`   当前余额: ¥${wallet.balance}`);
      console.log(`   锁定金额: ¥${wallet.lockedAmount}`);

      wallet.balance = 1000;
      wallet.lockedAmount = 0;
      wallet.totalDeposited = 1000;
      wallet.totalDonated = 0;
      wallet.transactions = [{
        type: '充值',
        amount: 1000,
        description: '账户余额重置',
        timestamp: new Date()
      }];
      await wallet.save();
      console.log('✅ 钱包余额已重置为 ¥1000');
    } else {
      console.log('⚠️  未找到钱包');
    }

    console.log('\n✅ 钱包重置完成！');
    console.log(`📊 最终状态：`);
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

resetWallet();
