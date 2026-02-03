require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');

async function cleanUserPastTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('已连接到数据库');

    // 查找用户
    const user = await User.findOne({ email: 'wangzhenghao16@gmail.com' });
    if (!user) {
      console.log('未找到用户');
      return;
    }
    console.log('找到用户:', user.username);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查找所有截止时间在今天之前的"进行中"重复任务实例
    const pastTasks = await Task.find({
      userId: user._id,
      deadline: { $lt: today },
      status: '进行中',
      parentTaskId: { $ne: null }
    });

    console.log(`找到 ${pastTasks.length} 个过去日期的任务`);

    if (pastTasks.length === 0) {
      console.log('没有需要清理的任务');
      await mongoose.connection.close();
      return;
    }

    // 显示要删除的任务
    pastTasks.forEach(task => {
      console.log(`- ${task.title} (截止: ${task.deadline.toLocaleDateString()}, 赌注: ${task.betAmount}元)`);
    });

    // 计算需要退还的总金额
    let totalRefund = 0;
    for (const task of pastTasks) {
      totalRefund += Number(task.betAmount);
      await Task.deleteOne({ _id: task._id });
    }

    console.log(`已删除 ${pastTasks.length} 个任务`);

    // 更新钱包：解锁金额并返还到余额
    if (totalRefund > 0) {
      const wallet = await Wallet.findOne({ userId: user._id });
      if (wallet) {
        const oldBalance = Number(wallet.balance);
        const oldLocked = Number(wallet.lockedAmount);

        wallet.lockedAmount = oldLocked - totalRefund;
        wallet.balance = oldBalance + totalRefund;
        wallet.transactions.push({
          type: '任务解锁',
          amount: totalRefund,
          description: `清理 ${pastTasks.length} 个过去日期的任务，退还赌注`
        });
        await wallet.save();

        console.log(`\n钱包更新:`);
        console.log(`- 余额: ${oldBalance} → ${wallet.balance} (+ ${totalRefund})`);
        console.log(`- 锁定: ${oldLocked} → ${wallet.lockedAmount} (- ${totalRefund})`);
      }
    }

    console.log('\n清理完成！');
    await mongoose.connection.close();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanUserPastTasks();
