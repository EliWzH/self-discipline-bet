import api from './api';

// 获取浏览器时区
const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.error('Failed to detect timezone:', e);
    return 'UTC'; // 兜底使用 UTC
  }
};

const authService = {
  async register(userData) {
    const timezone = getBrowserTimezone();
    const { data } = await api.post('/auth/register', {
      ...userData,
      timezone
    });
    return data;
  },

  async login(email, password) {
    const timezone = getBrowserTimezone();
    const { data } = await api.post('/auth/login', {
      email,
      password,
      timezone
    });
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  logout() {
    localStorage.clear();
  }
};

export default authService;
