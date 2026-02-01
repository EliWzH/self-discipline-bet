const Task = require('../models/Task');

/**
 * 为指定用户生成今日待办实例
 * @param {String} userId - 用户 ID
 * @returns {Array} 新生成的实例数组
 */
const generatePendingInstances = async (userId) => {
  const newInstances = [];

  try {
    // 查询该用户的所有模板任务
    const templates = await Task.find({
      userId,
      isRecurring: true,
      templateTask: true
    });

    if (!templates.length) return newInstances;

    // 计算今天的时间范围（00:00 ~ 23:59:59）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayWeekday = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    for (const template of templates) {
      const { frequency, daysOfWeek, startTime, endDate, occurrences } = template.recurrence;

      // 检查是否已达到结束日期
      if (endDate && today > new Date(endDate)) {
        continue;
      }

      // 检查是否已达到最大次数
      if (occurrences) {
        const existingCount = await Task.countDocuments({
          userId,
          parentTaskId: template._id,
          templateTask: false
        });
        if (existingCount >= occurrences) {
          continue;
        }
      }

      // 判断今天是否需要生成
      let shouldGenerate = false;

      if (frequency === 'daily') {
        shouldGenerate = true;
      } else if (frequency === 'weekly') {
        // weekly 必须今天在 daysOfWeek 中
        if (daysOfWeek && daysOfWeek.length > 0) {
          shouldGenerate = daysOfWeek.includes(todayWeekday);
        }
      }

      if (!shouldGenerate) continue;

      // 原子 upsert：只根据 lastErrorObject.upserted 判断新建
      const [hours, minutes] = startTime.split(':');
      const deadline = new Date(today);
      deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const result = await Task.findOneAndUpdate(
        {
          userId,
          parentTaskId: template._id,
          templateTask: false,
          deadline
        },
        {
          $setOnInsert: {
            userId,
            title: template.title,
            description: template.description,
            category: template.category,
            betAmount: template.betAmount,
            deadline,
            judgeUserId: template.judgeUserId,
            parentTaskId: template._id,
            templateTask: false,
            status: '进行中'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
      );

      // 只有 upserted 为 true 才是新建
      if (result.lastErrorObject && result.lastErrorObject.upserted) {
        newInstances.push(result.value);
      }
    }

    return newInstances;
  } catch (error) {
    console.error('生成重复任务实例失败:', error);
    throw error;
  }
};

/**
 * 为指定用户生成日期范围内的待办实例
 * @param {String} userId - 用户 ID
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Array} 新生成的实例数组
 */
const generateInstancesForDateRange = async (userId, startDate, endDate) => {
  const newInstances = [];

  try {
    // 查询该用户的所有模板任务
    const templates = await Task.find({
      userId,
      isRecurring: true,
      templateTask: true
    });

    if (!templates.length) return newInstances;

    // 遍历日期范围
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayWeekday = dayStart.getDay();

      for (const template of templates) {
        const { frequency, daysOfWeek, startTime, endDate: recurEndDate, occurrences } = template.recurrence;

        // 检查是否已达到结束日期
        if (recurEndDate && dayStart > new Date(recurEndDate)) {
          continue;
        }

        // 检查是否已达到最大次数
        if (occurrences) {
          const existingCount = await Task.countDocuments({
            userId,
            parentTaskId: template._id,
            templateTask: false
          });
          if (existingCount >= occurrences) {
            continue;
          }
        }

        // 判断这一天是否需要生成
        let shouldGenerate = false;

        if (frequency === 'daily') {
          shouldGenerate = true;
        } else if (frequency === 'weekly') {
          if (daysOfWeek && daysOfWeek.length > 0) {
            shouldGenerate = daysOfWeek.includes(dayWeekday);
          }
        }

        if (!shouldGenerate) continue;

        // 原子 upsert
        const [hours, minutes] = startTime.split(':');
        const deadline = new Date(dayStart);
        deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const result = await Task.findOneAndUpdate(
          {
            userId,
            parentTaskId: template._id,
            templateTask: false,
            deadline
          },
          {
            $setOnInsert: {
              userId,
              title: template.title,
              description: template.description,
              category: template.category,
              betAmount: template.betAmount,
              deadline,
              judgeUserId: template.judgeUserId,
              parentTaskId: template._id,
              templateTask: false,
              status: '进行中'
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
        );

        // 只有 upserted 为 true 才是新建
        if (result.lastErrorObject && result.lastErrorObject.upserted) {
          newInstances.push(result.value);
        }
      }

      // 下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return newInstances;
  } catch (error) {
    console.error('生成日期范围内的重复任务实例失败:', error);
    throw error;
  }
};

module.exports = {
  generatePendingInstances,
  generateInstancesForDateRange
};
