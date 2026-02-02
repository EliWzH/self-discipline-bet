const mongoose = require('mongoose');
const TaskStatus = require('../constants/taskStatus');
const TaskCategories = require('../constants/taskCategories');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, '任务标题不能为空'],
    trim: true,
    maxlength: [200, '标题不能超过 200 字']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '描述不能超过 1000 字']
  },
  category: {
    type: String,
    required: true,
    enum: TaskCategories,
    default: '其他'
  },
  betAmount: {
    type: Number,
    required: [true, '赌注金额不能为空'],
    min: [1, '赌注金额至少为 1'],
    max: [10000, '赌注金额不能超过 10000']
  },
  deadline: {
    type: Date,
    required: function() {
      // 模板任务不需要截止时间
      return !this.templateTask && !this.isTemplate;
    },
    validate: {
      validator: function(v) {
        // 如果没有截止时间（重复任务模板），跳过验证
        if (!v) return true;
        // 允许截止时间在当前时间30秒之后（给网络延迟和时区差异留缓冲）
        const now = new Date();
        const minDeadline = new Date(now.getTime() - 30000); // 30秒前
        return v > minDeadline;
      },
      message: '截止时间必须是未来时间'
    }
  },
  status: {
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.IN_PROGRESS
  },
  startedAt: {
    type: Date
  },
  submittedAt: {
    type: Date
  },
  judgedAt: {
    type: Date
  },
  judgement: {
    result: {
      type: String,
      enum: ['通过', '未通过', '待审判']
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String,
    aiModel: String,
    judgedBy: String  // 'AI' or 'SYSTEM'
  },
  evidence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evidence'
  },
  // 好友判决字段
  judgeUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  judgeStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  judgeComment: {
    type: String,
    maxlength: [1000, '评论不能超过 1000 字']
  },
  judgedByFriendAt: {
    type: Date
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      required: function() {
        return this.isRecurring;
      }
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function(v) {
          if (!v) return true;
          return v.every(d => d >= 0 && d <= 6);
        },
        message: 'daysOfWeek must be between 0-6'
      }
    },
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      required: function() {
        return this.isRecurring;
      }
    },
    endDate: {
      type: Date
    },
    occurrences: {
      type: Number,
      min: 1,
      max: 365
    }
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  templateTask: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    trim: true,
    maxlength: [100, '模板名称不能超过 100 字']
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引优化
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ deadline: 1 });

// 防止同一天重复生成实例的复合唯一索引
taskSchema.index(
  { userId: 1, parentTaskId: 1, deadline: 1 },
  { unique: true, partialFilterExpression: { templateTask: false, parentTaskId: { $ne: null } } }
);

module.exports = mongoose.model('Task', taskSchema);
