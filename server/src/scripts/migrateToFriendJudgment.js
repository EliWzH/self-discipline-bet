const mongoose = require('mongoose');
const Task = require('../models/Task');
const connectDB = require('../config/database');

const migrate = async () => {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功');
    console.log('开始迁移...\n');

    // 查找所有有AI判决的任务
    const tasksWithAI = await Task.find({
      'judgement.judgedBy': 'AI'
    });

    console.log(`找到 ${tasksWithAI.length} 个使用 AI 判决的任务\n`);

    if (tasksWithAI.length === 0) {
      console.log('没有需要迁移的任务');
      process.exit(0);
    }

    let updated = 0;
    for (const task of tasksWithAI) {
      console.log(`处理任务: ${task.title} (${task._id})`);
      console.log(`  当前状态: ${task.status}`);

      // 根据现有状态设置 judgeStatus
      if (task.status === 'COMPLETED' || task.status === '已完成') {
        task.judgeStatus = 'approved';
        console.log(`  设置 judgeStatus = approved`);
      } else if (task.status === 'FAILED' || task.status === '已失败') {
        task.judgeStatus = 'rejected';
        console.log(`  设置 judgeStatus = rejected`);
      } else {
        // 其他状态保持 pending
        task.judgeStatus = 'pending';
        console.log(`  保持 judgeStatus = pending`);
      }

      // judgeUserId 保持为 null（历史 AI 判决任务）
      // judgeComment 保持为空

      await task.save();
      updated++;
      console.log(`  ✅ 已更新\n`);
    }

    console.log(`\n迁移完成！`);
    console.log(`✅ 成功更新 ${updated} 个任务`);
    console.log(`\n注意事项：`);
    console.log(`- AI 判决的任务 judgeUserId 保持为 null`);
    console.log(`- 可以通过 judgeUserId 是否为 null 来区分 AI 判决和好友判决`);
    console.log(`- 新任务必须指定好友作为判决人\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
};

// 运行迁移
migrate();
