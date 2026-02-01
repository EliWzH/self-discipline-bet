const Wallet = require('../models/Wallet');

// 获取钱包信息
exports.getWallet = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ error: '钱包不存在' });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    next(error);
  }
};

// 虚拟充值
exports.deposit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '充值金额必须大于 0' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: '单次充值不能超过 10000' });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ error: '钱包不存在' });
    }

    wallet.balance += amount;
    wallet.totalDeposited += amount;
    wallet.transactions.push({
      type: '充值',
      amount,
      description: `虚拟充值 ${amount} 元`
    });
    await wallet.save();

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    next(error);
  }
};

// 获取交易历史
exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 20, offset = 0 } = req.query;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ error: '钱包不存在' });
    }

    // 倒序获取交易（最新的在前）
    const transactions = wallet.transactions
      .reverse()
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      transactions,
      total: wallet.transactions.length
    });
  } catch (error) {
    next(error);
  }
};
