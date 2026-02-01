import api from './api';

const friendService = {
  async getFriends() {
    const { data } = await api.get('/friends');
    return data.friends;
  },

  async sendInvite(email, message = '') {
    const { data } = await api.post('/friends/invite', { email, message });
    return data;
  },

  async acceptInvite(inviteId) {
    const { data } = await api.post(`/friends/accept/${inviteId}`);
    return data;
  },

  async rejectInvite(inviteId) {
    const { data } = await api.post(`/friends/reject/${inviteId}`);
    return data;
  },

  async getPendingInvitations() {
    const { data } = await api.get('/friends/invitations/pending');
    return data.invitations;
  },

  async getSentInvitations() {
    const { data } = await api.get('/friends/invitations/sent');
    return data.invitations;
  },

  async removeFriend(friendId) {
    const { data } = await api.delete(`/friends/${friendId}`);
    return data;
  }
};

export default friendService;
