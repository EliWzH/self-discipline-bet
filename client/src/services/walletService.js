import api from './api';

const walletService = {
  async getWallet() {
    const { data } = await api.get('/wallet');
    return data.wallet;
  },

  async deposit(amount) {
    const { data } = await api.post('/wallet/deposit', { amount });
    return data.wallet;
  },

  async getTransactions(limit = 20, offset = 0) {
    const { data } = await api.get(`/wallet/transactions?limit=${limit}&offset=${offset}`);
    return data;
  }
};

export default walletService;
