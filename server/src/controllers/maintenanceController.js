const Task = require('../models/Task');
const Wallet = require('../models/Wallet');

// 清理过去日期的重复任务实例
exports.cleanPastTasks = async (req, res, next) => {
  try {
    const userId = req.user.id; // 只清理当前用户的任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查找当前用户截止时间在今天之前的"进行中"重复任务实例
    const pastTasks = await Task.find({
      userId,  // 只查找当前用户的任务
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

    // 计算需要退还的总金额
    let totalRefund = 0;
    const deletedTasks = [];

    for (const task of pastTasks) {
      deletedTasks.push({
        title: task.title,
        deadline: task.deadline,
        betAmount: task.betAmount
      });
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
          description: `清理 ${pastTasks.length} 个过去日期的任务，退还赌注`
        });
        await wallet.save();
      }
    }

    res.json({
      success: true,
      message: `成功清理 ${pastTasks.length} 个过去日期的任务`,
      deleted: pastTasks.length,
      deletedTasks,
      refundAmount: totalRefund
    });
  } catch (error) {
    next(error);
  }
};
