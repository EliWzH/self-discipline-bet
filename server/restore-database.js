require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Wallet = require('./src/models/Wallet');
const Evidence = require('./src/models/Evidence');

const MONGODB_URI = process.env.MONGODB_URI;

async function restoreDatabase(backupFile) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到数据库\n');

    // 读取备份文件
    if (!fs.existsSync(backupFile)) {
      console.log('❌ 备份文件不存在:', backupFile);
      process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('📦 备份信息:');
    console.log(`   时间: ${backup.timestamp}`);
    console.log(`   用户: ${backup.counts.users}`);
    console.log(`   任务: ${backup.counts.tasks}`);
    console.log(`   钱包: ${backup.counts.wallets}`);
    console.log(`   证据: ${backup.counts.evidences}\n`);

    console.log('⚠️  警告: 这将删除当前所有数据并恢复备份！');
    console.log('按 Ctrl+C 取消，或等待 5 秒继续...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  删除当前数据...');
    await Evidence.deleteMany({});
    await Task.deleteMany({});
    await Wallet.deleteMany({});
    await User.deleteMany({});

    console.log('📥 恢复数据...\n');

    // 恢复用户
    if (backup.data.users.length > 0) {
      await User.insertMany(backup.data.users);
      console.log(`✅ 恢复了 ${backup.data.users.length} 个用户`);
    }

    // 恢复钱包
    if (backup.data.wallets.length > 0) {
      await Wallet.insertMany(backup.data.wallets);
      console.log(`✅ 恢复了 ${backup.data.wallets.length} 个钱包`);
    }

    // 恢复任务
    if (backup.data.tasks.length > 0) {
      await Task.insertMany(backup.data.tasks);
      console.log(`✅ 恢复了 ${backup.data.tasks.length} 个任务`);
    }

    // 恢复证据
    if (backup.data.evidences.length > 0) {
      await Evidence.insertMany(backup.data.evidences);
      console.log(`✅ 恢复了 ${backup.data.evidences.length} 条证据`);
    }

    console.log('\n🎉 数据恢复完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    process.exit(1);
  }
}

const backupFile = process.argv[2];
if (!backupFile) {
  console.log('用法: node restore-database.js <备份文件路径>');
  console.log('\n最近的备份文件:');

  const backupDir = path.join(__dirname, 'backups');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
      .slice(0, 5);

    files.forEach(f => {
      console.log(`  node restore-database.js backups/${f}`);
    });
  }

  process.exit(1);
}

restoreDatabase(backupFile);
