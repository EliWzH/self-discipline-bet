const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['充值', '任务锁定', '任务解锁', '任务失败扣款', '任务成功返还'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  description: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 1000,  // 初始虚拟金额
    min: 0
  },
  lockedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 1000
  },
  totalDonated: {
    type: Number,
    default: 0
  },
  transactions: [transactionSchema]
}, {
  timestamps: true
});

// 虚拟字段：可用余额
walletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.lockedAmount;
});

// 确保虚拟字段在 JSON 序列化时包含
walletSchema.set('toJSON', { virtuals: true });
walletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wallet', walletSchema);
