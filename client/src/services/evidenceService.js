import api from './api';

const evidenceService = {
  async submitEvidence(taskId, description, images) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('description', description);

    images.forEach((image) => {
      formData.append('images', image);
    });

    const { data } = await api.post('/evidence/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async getEvidence(taskId) {
    const { data } = await api.get(`/evidence/${taskId}`);
    return data.evidence;
  },

  async judgeTask(taskId, status, comment) {
    const { data } = await api.post(`/judgement/judge/${taskId}`, {
      status,
      comment
    });
    return data;
  },

  async getTasksToJudge() {
    const { data } = await api.get('/judgement/tasks-to-judge');
    return data.tasks;
  }
};

export default evidenceService;
