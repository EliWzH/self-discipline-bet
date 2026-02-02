require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');
const Evidence = require('./src/models/Evidence');

const MONGODB_URI = process.env.MONGODB_URI;

async function backupDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库\n');

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, 'backups');

    // 创建备份目录
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    console.log('📦 开始备份数据...\n');

    // 获取所有数据
    const users = await User.find({}).lean();
    const tasks = await Task.find({}).lean();
    const wallets = await Wallet.find({}).lean();
    const evidences = await Evidence.find({}).lean();

    const backup = {
      timestamp: new Date().toISOString(),
      counts: {
        users: users.length,
        tasks: tasks.length,
        wallets: wallets.length,
        evidences: evidences.length
      },
      data: {
        users,
        tasks,
        wallets,
        evidences
      }
    };

    // 写入文件
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('✅ 备份完成！');
    console.log(`\n📊 备份统计:`);
    console.log(`   用户: ${users.length}`);
    console.log(`   任务: ${tasks.length}`);
    console.log(`   钱包: ${wallets.length}`);
    console.log(`   证据: ${evidences.length}`);
    console.log(`\n💾 备份文件: ${backupFile}`);
    console.log(`   大小: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);

    // 列出所有备份文件
    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
      .slice(0, 5);

    if (backupFiles.length > 0) {
      console.log('📋 最近的备份文件:');
      backupFiles.forEach(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        const date = f.replace('backup-', '').replace('.json', '');
        console.log(`   ${date} (${(stats.size / 1024).toFixed(2)} KB)`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 备份失败:', error);
    process.exit(1);
  }
}

backupDatabase();
