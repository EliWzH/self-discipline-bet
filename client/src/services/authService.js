import api from './api';

const authService = {
  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
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
