require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Task = require('./src/models/Task');

async function updateTaskDeadlines() {
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

    // 查找 "今天运动40分钟" 的模板任务
    const template = await Task.findOne({
      userId: user._id,
      title: '今天运动40分钟',
      templateTask: true
    });

    if (!template) {
      console.log('未找到模板任务');
      return;
    }

    console.log('找到模板任务:', template.title);
    console.log('当前时间设置:', template.recurrence.startTime);

    // 更新模板的时间为 23:59
    template.recurrence.startTime = '23:59';
    await template.save();
    console.log('✓ 模板任务已更新为 23:59');

    // 查找所有该模板的实例任务
    const instances = await Task.find({
      userId: user._id,
      parentTaskId: template._id,
      templateTask: false
    });

    console.log(`\n找到 ${instances.length} 个任务实例`);

    // 更新每个实例的截止时间为当天的 23:59
    for (const task of instances) {
      const oldDeadline = new Date(task.deadline);
      const newDeadline = new Date(oldDeadline);
      newDeadline.setHours(23, 59, 0, 0);

      console.log(`\n任务: ${task.title}`);
      console.log(`  日期: ${oldDeadline.toLocaleDateString()}`);
      console.log(`  旧时间: ${oldDeadline.toLocaleTimeString()}`);
      console.log(`  新时间: ${newDeadline.toLocaleTimeString()}`);

      task.deadline = newDeadline;
      await task.save();
      console.log('  ✓ 已更新');
    }

    console.log('\n全部更新完成！');
    await mongoose.connection.close();
  } catch (error) {
    console.error('错误:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateTaskDeadlines();
