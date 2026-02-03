const Task = require('../models/Task');
const Wallet = require('../models/Wallet');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// 用户时区
const USER_TIMEZONE = 'America/Toronto';

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

// 更新任务截止时间为23:59
exports.updateTaskDeadlines = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskTitle, newTime } = req.body; // newTime格式: "23:59"

    if (!taskTitle || !newTime) {
      return res.status(400).json({
        success: false,
        error: '缺少任务标题或新时间'
      });
    }

    // 查找模板任务
    const template = await Task.findOne({
      userId,
      title: taskTitle,
      templateTask: true
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: '未找到模板任务'
      });
    }

    // 更新模板的时间
    const oldTime = template.recurrence.startTime;
    template.recurrence.startTime = newTime;
    await template.save();

    // 查找所有实例任务
    const instances = await Task.find({
      userId,
      parentTaskId: template._id,
      templateTask: false
    });

    const updates = [];

    // 更新每个实例的截止时间
    for (const task of instances) {
      // 获取原截止时间在用户时区的日期
      const oldDeadlineUserTZ = dayjs(task.deadline).tz(USER_TIMEZONE);

      // 解析新时间
      const [hours, minutes] = newTime.split(':');

      // 在用户时区的同一天设置新时间
      const newDeadlineUserTZ = oldDeadlineUserTZ
        .hour(parseInt(hours))
        .minute(parseInt(minutes))
        .second(0)
        .millisecond(0);

      // 转换为 UTC 存储
      const newDeadline = newDeadlineUserTZ.utc().toDate();

      updates.push({
        date: oldDeadlineUserTZ.format('YYYY/M/D'),
        oldTime: oldDeadlineUserTZ.format('HH:mm'),
        newTime: newDeadlineUserTZ.format('HH:mm')
      });

      task.deadline = newDeadline;
      await task.save();
    }

    res.json({
      success: true,
      message: `成功更新 ${instances.length} 个任务的截止时间`,
      templateUpdated: {
        title: taskTitle,
        oldTime,
        newTime
      },
      instancesUpdated: instances.length,
      updates
    });
  } catch (error) {
    next(error);
  }
};
