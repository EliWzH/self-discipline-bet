export const TASK_STATUS = {
  PENDING: '待开始',
  IN_PROGRESS: '进行中',
  SUBMITTED: '已提交',
  JUDGING: '审判中',
  COMPLETED: '已完成',
  FAILED: '已失败',
  EXPIRED: '已过期'
};

export const TASK_CATEGORIES = [
  '运动健身',
  '学习进修',
  '戒除习惯',
  '项目完成',
  '其他'
];

export const STATUS_COLORS = {
  '待开始': 'bg-gray-600',
  '进行中': 'bg-blue-600',
  '已提交': 'bg-yellow-600',
  '审判中': 'bg-purple-600',
  '已完成': 'bg-green-600',
  '已失败': 'bg-red-600',
  '已过期': 'bg-gray-500'
};
