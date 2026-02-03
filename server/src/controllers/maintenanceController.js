const Task = require('../models/Task');
const Wallet = require('../models/Wallet');

// 清理过去日期的重复任务实例
exports.cleanPastTasks = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查找所有截止时间在今天之前的"进行中"重复任务实例
    const pastTasks = await Task.find({
      deadline: { $lt: today },
      status: '进行中',
      parentTaskId: { $ne: null }  // 只处理重复任务的实例
    });

    console.log(`找到 ${pastTasks.length} 个过去日期的任务`);

    if (pastTasks.length === 0) {
      return res.json({
        success: true,
        message: '没有需要清理的任务',
        deleted: 0
      });
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

    let totalDeleted = 0;
    const results = [];

    // 为每个用户清理任务
    for (const userId in tasksByUser) {
      const userTasks = tasksByUser[userId];

      // 计算需要退还的总金额
      let totalRefund = 0;
      const deletedTasks = [];

      for (const task of userTasks) {
        deletedTasks.push({
          title: task.title,
          deadline: task.deadline,
          betAmount: task.betAmount
        });
        totalRefund += Number(task.betAmount);
        await Task.deleteOne({ _id: task._id });
        totalDeleted++;
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
        }
      }

      results.push({
        userId,
        deletedCount: userTasks.length,
        refundAmount: totalRefund,
        tasks: deletedTasks
      });
    }

    res.json({
      success: true,
      message: `成功清理 ${totalDeleted} 个过去日期的任务`,
      deleted: totalDeleted,
      results
    });
  } catch (error) {
    next(error);
  }
};
