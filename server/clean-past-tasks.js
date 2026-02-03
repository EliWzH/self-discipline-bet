require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanPastTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`📅 今天: ${today.toLocaleDateString()}\n`);

    // 查找所有截止时间在今天之前的"进行中"任务
    const pastTasks = await Task.find({
      deadline: { $lt: today },
      status: '进行中',
      parentTaskId: { $ne: null }  // 只处理重复任务的实例
    });

    console.log(`🔍 找到 ${pastTasks.length} 个过去日期的任务\n`);

    if (pastTasks.length === 0) {
      console.log('✅ 没有需要清理的任务');
      process.exit(0);
    }

    // 按用户分组
    const tasksByUser = {};
    pastTasks.forEach(task => {
      const userId = task.userId.toString();
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }
      tasksByUser[userId].push(task);
    });

    // 为每个用户清理任务
    for (const userId in tasksByUser) {
      const userTasks = tasksByUser[userId];
      console.log(`\n👤 用户 ${userId}:`);
      console.log(`   需要删除 ${userTasks.length} 个过去的任务\n`);

      // 计算需要退还的总金额
      let totalRefund = 0;
      for (const task of userTasks) {
        console.log(`   - ${task.title} (截止: ${task.deadline.toLocaleDateString()})`);
        totalRefund += Number(task.betAmount);
        await Task.deleteOne({ _id: task._id });
      }

      // 更新钱包：解锁金额并返还到余额
      if (totalRefund > 0) {
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          wallet.lockedAmount = Number(wallet.lockedAmount) - totalRefund;
          wallet.balance = Number(wallet.balance) + totalRefund;
          wallet.transactions.push({
            type: '任务解锁',
            amount: totalRefund,
            description: `清理 ${userTasks.length} 个过去日期的任务，退还赌注`
          });
          await wallet.save();
          console.log(`   💰 退还金额: ¥${totalRefund}`);
        }
      }
    }

    console.log(`\n✅ 清理完成！共删除 ${pastTasks.length} 个任务`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

cleanPastTasks();
