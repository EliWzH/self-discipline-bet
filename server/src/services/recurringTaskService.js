const Task = require('../models/Task');
const User = require('../models/User');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 为指定用户生成今日待办实例
 * @param {String} userId - 用户 ID
 * @returns {Array} 新生成的实例数组
 */
const generatePendingInstances = async (userId) => {
  const newInstances = [];

  try {
    // 获取用户时区（如果未设置则使用 UTC）
    const user = await User.findById(userId);
    const userTimezone = user?.timezone || 'UTC';

    // 查询该用户的所有模板任务
    const templates = await Task.find({
      userId,
      isRecurring: true,
      templateTask: true
    });

    if (!templates.length) return newInstances;

    // 计算今天的时间范围（用户时区）
    const todayUserTZ = dayjs().tz(userTimezone);
    const todayStart = todayUserTZ.startOf('day');
    const todayEnd = todayUserTZ.endOf('day');
    const todayWeekday = todayUserTZ.day(); // 0=Sun, 1=Mon, ..., 6=Sat

    for (const template of templates) {
      const { frequency, daysOfWeek, startTime, endDate, occurrences } = template.recurrence;

      // 检查是否已达到结束日期
      if (endDate && todayStart.isAfter(dayjs(endDate).tz(USER_TIMEZONE))) {
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

      // 解析 startTime 并在用户时区设置时间
      const [hours, minutes] = startTime.split(':');
      const deadlineUserTZ = todayUserTZ
        .hour(parseInt(hours))
        .minute(parseInt(minutes))
        .second(0)
        .millisecond(0);

      // 转换为 UTC 存储
      const deadline = deadlineUserTZ.utc().toDate();

      // 原子 upsert
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
    // 获取用户时区（如果未设置则使用 UTC）
    const user = await User.findById(userId);
    const userTimezone = user?.timezone || 'UTC';

    // 查询该用户的所有模板任务
    const templates = await Task.find({
      userId,
      isRecurring: true,
      templateTask: true
    });

    if (!templates.length) return newInstances;

    // 获取今天的开始时间（用户时区）
    const todayUserTZ = dayjs().tz(userTimezone).startOf('day');

    // 遍历日期范围，但只为今天及以后的日期生成实例
    let currentDate = dayjs(startDate).tz(USER_TIMEZONE);
    const end = dayjs(endDate).tz(USER_TIMEZONE);

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dayStart = currentDate.startOf('day');

      // 跳过过去的日期
      if (dayStart.isBefore(todayUserTZ)) {
        currentDate = currentDate.add(1, 'day');
        continue;
      }

      const dayWeekday = currentDate.day();

      for (const template of templates) {
        const { frequency, daysOfWeek, startTime, endDate: recurEndDate, occurrences } = template.recurrence;

        // 检查是否已达到结束日期
        if (recurEndDate && currentDate.isAfter(dayjs(recurEndDate).tz(USER_TIMEZONE))) {
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

        // 解析 startTime 并在用户时区设置时间
        const [hours, minutes] = startTime.split(':');
        const deadlineUserTZ = currentDate
          .hour(parseInt(hours))
          .minute(parseInt(minutes))
          .second(0)
          .millisecond(0);

        // 转换为 UTC 存储
        const deadline = deadlineUserTZ.utc().toDate();

        // 原子 upsert
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
      currentDate = currentDate.add(1, 'day');
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
