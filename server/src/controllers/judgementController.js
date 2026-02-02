const Task = require('../models/Task');
const Evidence = require('../models/Evidence');
const Wallet = require('../models/Wallet');
const TaskStatus = require('../constants/taskStatus');
// const claudeService = require('../services/claudeService'); // 保留注释以便回滚

// 好友判决任务
exports.judgeTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, comment } = req.body; // status: 'approved' or 'rejected'
    const judgeUserId = req.user._id;

    // 验证输入
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '判决状态必须是 approved 或 rejected' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: '请填写判决评论' });
    }

    // 查找任务
    const task = await Task.findById(taskId).populate('userId', 'username email');
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 验证当前用户是该任务的判决人
    if (!task.judgeUserId || !task.judgeUserId.equals(judgeUserId)) {
      return res.status(403).json({ error: '你不是该任务的审判者' });
    }

    // 验证任务状态
    if (task.status !== TaskStatus.SUBMITTED) {
      return res.status(400).json({ error: '任务状态不正确，只能审判已提交的任务' });
    }

    // 验证未被判决过
    if (task.judgeStatus !== 'pending') {
      return res.status(400).json({ error: '该任务已被审判' });
    }

    // 获取证据（用于日志记录）
    const evidence = await Evidence.findById(task.evidence);
    if (!evidence) {
      return res.status(404).json({ error: '未找到任务证据' });
    }

    // 更新任务判决信息
    task.judgeStatus = status;
    task.judgeComment = comment.trim();
    task.judgedByFriendAt = new Date();
    task.judgedAt = new Date(); // 保持兼容性

    // 获取钱包
    const wallet = await Wallet.findOne({ userId: task.userId });

    if (status === 'approved') {
      task.status = TaskStatus.COMPLETED;

      // 解锁并返还赌注（确保数字相加）
      wallet.balance = Number(wallet.balance) + Number(task.betAmount);
      wallet.lockedAmount = Number(wallet.lockedAmount) - Number(task.betAmount);
      wallet.transactions.push({
        type: '任务成功返还',
        amount: task.betAmount,
        taskId: task._id,
        description: `任务"${task.title}"完成，好友审判通过，返还赌注`
      });
    } else {
      task.status = TaskStatus.FAILED;

      // 扣除赌注（确保数字相加）
      wallet.lockedAmount = Number(wallet.lockedAmount) - Number(task.betAmount);
      wallet.totalDonated = Number(wallet.totalDonated) + Number(task.betAmount);
      wallet.transactions.push({
        type: '任务失败扣款',
        amount: -task.betAmount,
        taskId: task._id,
        description: `任务"${task.title}"失败，好友审判未通过，扣除赌注`
      });
    }

    await task.save();
    await wallet.save();

    res.json({
      success: true,
      task,
      wallet: {
        balance: wallet.balance,
        lockedAmount: wallet.lockedAmount,
        totalDonated: wallet.totalDonated
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取审判结果
exports.getJudgementResult = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (!task.judgement) {
      return res.status(404).json({ error: '暂无审判结果' });
    }

    res.json({
      success: true,
      judgement: task.judgement,
      task
    });
  } catch (error) {
    next(error);
  }
};

// 获取待我审判的任务列表（包括进行中和已提交的，过滤掉失败的任务）
exports.getTasksToJudge = async (req, res, next) => {
  try {
    const judgeUserId = req.user._id;

    // 获取所有我作为判决人的任务（进行中、已提交、待判决），排除失败和已存档的任务
    const tasks = await Task.find({
      judgeUserId,
      status: { $ne: TaskStatus.FAILED }, // 排除失败的任务
      archived: { $ne: true }, // 排除已存档的任务
      $or: [
        { status: TaskStatus.IN_PROGRESS },
        { status: TaskStatus.SUBMITTED, judgeStatus: 'pending' }
      ]
    })
      .populate('userId', 'username email')
      .populate('evidence')
      .sort({ submittedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    next(error);
  }
};
