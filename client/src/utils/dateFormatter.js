export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeRemaining = (deadline) => {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;

  if (diff <= 0) return '已过期';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `剩余 ${days} 天`;
  if (hours > 0) return `剩余 ${hours} 小时`;
  return '即将截止';
};

// 将 datetime-local 输入值转换为 ISO 字符串
export const datetimeLocalToISO = (datetimeLocal) => {
  // datetime-local 格式: "2026-02-03T23:59"
  // 需要转换为 Date 对象，然后获取 ISO 字符串
  if (!datetimeLocal) return null;
  const date = new Date(datetimeLocal);
  return date.toISOString();
};

// 获取当前本地时间的 datetime-local 格式字符串 (用于默认值)
export const getCurrentDatetimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 获取明天晚上 23:59 的 datetime-local 格式
export const getTomorrowEndOfDay = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
  const day = tomorrow.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
};
