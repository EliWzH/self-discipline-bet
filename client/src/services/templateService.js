import api from './api';

const templateService = {
  async getTemplates() {
    const { data } = await api.get('/tasks/templates/list');
    return data.templates;
  },

  async createTemplate(templateData) {
    const { data } = await api.post('/tasks/templates/create', templateData);
    return data.template;
  },

  async createTaskFromTemplate(templateId, taskData) {
    const { data } = await api.post(`/tasks/templates/${templateId}/use`, taskData);
    return data;
  },

  async deleteTemplate(templateId) {
    const { data } = await api.delete(`/tasks/templates/${templateId}`);
    return data;
  }
};

export default templateService;
