const Task = require('../models/Task');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const TaskStatus = require('../constants/taskStatus');
const { generatePendingInstances, generateInstancesForDateRange } = require('../services/recurringTaskService');

// 创建任务
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, category, betAmount, deadline, judgeUserId, isRecurring, recurrence } = req.body;
    const userId = req.user._id;

    // 验证必填字段
    if (!title || !betAmount || !category) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    if (!isRecurring && !deadline) {
      return res.status(400).json({ error: '请设置截止时间' });
    }

    // 验证判决人
    if (!judgeUserId) {
      return res.status(400).json({ error: '请选择审判好友' });
    }

    // 验证判决人是好友
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const isFriend = user.friends.some(friendId => friendId.equals(judgeUserId));
    if (!isFriend) {
      return res.status(400).json({ error: '审判者必须是你的好友' });
    }

    // 验证判决人存在
    const judge = await User.findById(judgeUserId);
    if (!judge) {
      return res.status(404).json({ error: '审判者不存在' });
    }

    // 检查钱包余额
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ error: '钱包不存在' });
    }

    // 判断是否为重复任务
    if (isRecurring) {
      // 创建模板任务（不扣款，不检查余额）
      const template = new Task({
        userId,
        title,
        description,
        category,
        betAmount,
        judgeUserId,
        isRecurring: true,
        recurrence,
        templateTask: true
      });
      await template.save();

      // 生成今日实例（不在此扣款，留给 getTasks）
      const newInstances = await generatePendingInstances(userId);

      return res.status(201).json({
        success: true,
        task: template,
        generatedCount: newInstances.length
      });
    } else {
      // 普通任务：检查余额
      const availableBalance = wallet.balance - wallet.lockedAmount;
      if (availableBalance < betAmount) {
        return res.status(400).json({
          error: '余额不足',
          availableBalance,
          required: betAmount
        });
      }

      // 创建任务（直接进入进行中状态）
      const task = new Task({
        userId,
        title,
        description,
        category,
        betAmount,
        deadline: new Date(deadline),
        judgeUserId,
        judgeStatus: 'pending',
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date()
      });
      await task.save();

      // 锁定赌注（确保数字相加）
      wallet.lockedAmount = Number(wallet.lockedAmount) + Number(betAmount);
      wallet.transactions.push({
        type: '任务锁定',
        amount: -betAmount,
        taskId: task._id,
        description: `创建任务"${title}"，锁定赌注`
      });
      await wallet.save();

      res.status(201).json({
        success: true,
        task,
        wallet: {
          balance: wallet.balance,
          lockedAmount: wallet.lockedAmount
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// 获取任务列表
exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, category, month } = req.query;

    let newInstances = [];

    // 如果请求指定了月份（日历视图），生成整月的实例
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      newInstances = await generateInstancesForDateRange(userId, startDate, endDate);
    } else {
      // 否则只生成今日实例
      newInstances = await generatePendingInstances(userId);
    }

    // 对新生成的实例执行扣款（只扣一次）
    if (newInstances.length > 0) {
      const wallet = await Wallet.findOne({ userId });

      for (const instance of newInstances) {
        wallet.balance = Number(wallet.balance) - Number(instance.betAmount);
        wallet.lockedAmount = Number(wallet.lockedAmount) + Number(instance.betAmount);
      }
      await wallet.save();
    }

    // 首先检查并自动失败过期任务（不阻塞主请求）
    try {
      await autoFailExpiredTasks(userId);
    } catch (expireError) {
      console.error('自动失败检查出错:', expireError);
      // 继续执行，不影响任务列表获取
    }

    const filter = { userId, templateTask: false };

    // 默认不返回已存档的任务，除非明确请求
    if (req.query.archived === 'true') {
      filter.archived = true;
    } else if (req.query.archived === 'all') {
      // 不过滤archived字段
    } else {
      filter.archived = { $ne: true };
    }

    if (status) filter.status = status;
    if (category) filter.category = category;

    // 支持按月份过滤（格式: YYYY-MM）
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      filter.deadline = { $gte: startDate, $lte: endDate };
    }

    const tasks = await Task.find(filter)
      .populate('evidence')
      .populate('judgeUserId', 'username email')
      .sort({ createdAt: -1 });

    // 收集所有 parentTaskId 并去重
    const parentIds = [...new Set(
      tasks.filter(t => t.parentTaskId).map(t => t.parentTaskId.toString())
    )];

    // 一次性查询所有模板的 recurrence
    const templates = await Task.find({
      _id: { $in: parentIds }
    }).select('_id recurrence');

    const templateMap = templates.reduce((map, t) => {
      map[t._id.toString()] = t.recurrence;
      return map;
    }, {});

    // 附加 parentRecurrence 到实例任务
    const tasksWithRecurrence = tasks.map(task => {
      const taskObj = task.toObject();
      if (taskObj.parentTaskId) {
        taskObj.parentRecurrence = templateMap[taskObj.parentTaskId.toString()];
      }
      return taskObj;
    });

    res.json({
      success: true,
      tasks: tasksWithRecurrence
    });
  } catch (error) {
    next(error);
  }
};

// 自动失败过期的任务
const autoFailExpiredTasks = async (userId) => {
  const now = new Date();

  // 查找所有进行中且已过期的任务
  const expiredTasks = await Task.find({
    userId,
    status: TaskStatus.IN_PROGRESS,
    deadline: { $lt: now }
  });

  for (const task of expiredTasks) {
    task.status = TaskStatus.FAILED;
    await task.save();

    // 扣除锁定的赌注
    const wallet = await Wallet.findOne({ userId });
    if (wallet) {
      wallet.lockedAmount = Number(wallet.lockedAmount) - Number(task.betAmount);
      wallet.totalDonated = Number(wallet.totalDonated) + Number(task.betAmount);
      wallet.transactions.push({
        type: '任务失败',
        amount: -task.betAmount,
        taskId: task._id,
        description: `任务"${task.title}"超时未提交，赌注被扣除`
      });
      await wallet.save();
    }
  }
};

// 获取任务详情
exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId })
      .populate('evidence');

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// 开始任务（已废弃 - 任务创建后直接进入进行中状态）
exports.startTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 任务创建后已经是进行中状态，直接返回
    res.json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// 获取任务统计
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({
      userId,
      status: TaskStatus.COMPLETED
    });
    const failedTasks = await Task.countDocuments({
      userId,
      status: TaskStatus.FAILED
    });

    const wallet = await Wallet.findOne({ userId });

    const completionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        failedTasks,
        completionRate,
        lockedAmount: wallet?.lockedAmount || 0,
        totalDonated: wallet?.totalDonated || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除任务（仅未提交的进行中任务）
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 只能删除进行中且未提交的任务
    if (task.status !== TaskStatus.IN_PROGRESS) {
      return res.status(400).json({ error: '只能删除进行中的任务' });
    }

    // 解锁赌注
    const wallet = await Wallet.findOne({ userId });
    wallet.lockedAmount = Number(wallet.lockedAmount) - Number(task.betAmount);
    wallet.balance = Number(wallet.balance) + Number(task.betAmount);
    wallet.transactions.push({
      type: '任务解锁',
      amount: task.betAmount,
      taskId: task._id,
      description: `删除任务"${task.title}"，解锁赌注`
    });
    await wallet.save();

    await Task.deleteOne({ _id: id });

    res.json({
      success: true,
      message: '任务已删除'
    });
  } catch (error) {
    next(error);
  }
};

// 获取模板列表
exports.getTemplates = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const templates = await Task.find({
      userId,
      isTemplate: true
    })
      .select('templateName title description category betAmount judgeUserId')
      .populate('judgeUserId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    next(error);
  }
};

// 创建模板
exports.createTemplate = async (req, res, next) => {
  try {
    const { templateName, title, description, category, betAmount, judgeUserId } = req.body;
    const userId = req.user._id;

    // 验证必填字段
    if (!templateName || !title || !betAmount || !category) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // 验证判决人
    if (judgeUserId) {
      const user = await User.findById(userId);
      const isFriend = user.friends.some(friendId => friendId.equals(judgeUserId));
      if (!isFriend) {
        return res.status(400).json({ error: '审判者必须是你的好友' });
      }
    }

    // 创建模板
    const template = new Task({
      userId,
      templateName,
      title,
      description,
      category,
      betAmount,
      judgeUserId,
      isTemplate: true,
      templateTask: false,
      deadline: new Date(Date.now() + 86400000) // 临时日期，模板不使用
    });

    await template.save();

    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// 从模板创建任务
exports.createTaskFromTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deadline, isRecurring, recurrence } = req.body;
    const userId = req.user._id;

    // 查找模板
    const template = await Task.findOne({ _id: id, userId, isTemplate: true });

    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    // 判断是否为重复任务
    if (isRecurring) {
      // 创建重复任务模板
      const recurringTemplate = new Task({
        userId,
        title: template.title,
        description: template.description,
        category: template.category,
        betAmount: template.betAmount,
        judgeUserId: template.judgeUserId,
        isRecurring: true,
        recurrence,
        templateTask: true
      });
      await recurringTemplate.save();

      // 生成今日实例
      const newInstances = await generatePendingInstances(userId);

      return res.status(201).json({
        success: true,
        task: recurringTemplate,
        generatedCount: newInstances.length
      });
    } else {
      // 验证截止时间
      if (!deadline) {
        return res.status(400).json({ error: '请设置截止时间' });
      }

      // 检查钱包余额
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({ error: '钱包不存在' });
      }

      const availableBalance = wallet.balance - wallet.lockedAmount;
      if (availableBalance < template.betAmount) {
        return res.status(400).json({
          error: '余额不足',
          availableBalance,
          required: template.betAmount
        });
      }

      // 创建任务
      const task = new Task({
        userId,
        title: template.title,
        description: template.description,
        category: template.category,
        betAmount: template.betAmount,
        deadline: new Date(deadline),
        judgeUserId: template.judgeUserId,
        judgeStatus: 'pending',
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date()
      });
      await task.save();

      // 锁定赌注（确保数字相加）
      wallet.lockedAmount = Number(wallet.lockedAmount) + Number(template.betAmount);
      wallet.transactions.push({
        type: '任务锁定',
        amount: -template.betAmount,
        taskId: task._id,
        description: `创建任务"${template.title}"，锁定赌注`
      });
      await wallet.save();

      res.status(201).json({
        success: true,
        task,
        wallet: {
          balance: wallet.balance,
          lockedAmount: wallet.lockedAmount
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// 删除模板
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const template = await Task.findOne({ _id: id, userId, isTemplate: true });

    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    await Task.deleteOne({ _id: id });

    res.json({
      success: true,
      message: '模板已删除'
    });
  } catch (error) {
    next(error);
  }
};

// 存档任务
exports.archiveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    // 只能存档失败或已完成的任务
    if (task.status !== TaskStatus.FAILED && task.status !== TaskStatus.COMPLETED) {
      return res.status(400).json({ error: '只能存档已失败或已完成的任务' });
    }

    task.archived = true;
    await task.save();

    res.json({
      success: true,
      message: '任务已存档',
      task
    });
  } catch (error) {
    next(error);
  }
};

// 取消存档任务
exports.unarchiveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId });

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    task.archived = false;
    await task.save();

    res.json({
      success: true,
      message: '任务已取消存档',
      task
    });
  } catch (error) {
    next(error);
  }
};
