const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  toEmail: {
    type: String,
    required: [true, '邀请邮箱不能为空'],
    lowercase: true,
    trim: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  message: {
    type: String,
    maxlength: [200, '邀请消息不能超过 200 字']
  }
}, {
  timestamps: true
});

// 复合索引优化查询
invitationSchema.index({ toUserId: 1, status: 1 });
invitationSchema.index({ fromUserId: 1, status: 1 });
invitationSchema.index({ toEmail: 1, status: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);
