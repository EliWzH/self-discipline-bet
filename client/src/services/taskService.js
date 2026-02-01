import api from './api';

const taskService = {
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    const { data } = await api.get(`/tasks?${params}`);
    return data.tasks;
  },

  async getTaskById(id) {
    const { data } = await api.get(`/tasks/${id}`);
    return data.task;
  },

  async createTask(taskData) {
    const { data } = await api.post('/tasks', taskData);
    return data.task;
  },

  async startTask(id) {
    const { data } = await api.put(`/tasks/${id}/start`);
    return data.task;
  },

  async deleteTask(id) {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  async getStats() {
    const { data } = await api.get('/tasks/stats');
    return data.stats;
  }
};

export default taskService;
