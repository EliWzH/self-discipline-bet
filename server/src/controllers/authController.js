const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// 注册
exports.register = async (req, res, next) => {
  try {
    const { email, password, username, timezone } = req.body;

    // 验证必填字段
    if (!email || !password || !username) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }

    // 创建用户（包含时区，可为 null）
    const user = new User({
      email,
      password,
      username,
      timezone: timezone || null
    });
    await user.save();

    // 创建钱包
    const wallet = new Wallet({
      userId: user._id,
      transactions: [{
        type: '充值',
        amount: 1000,
        description: '注册赠送初始金额'
      }]
    });
    await wallet.save();

    // 关联钱包
    user.wallet = wallet._id;
    await user.save();

    // 生成 token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// 登录
exports.login = async (req, res, next) => {
  try {
    const { email, password, timezone } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 更新最后登录时间和时区
    user.lastLogin = new Date();
    if (timezone && timezone !== user.timezone) {
      user.timezone = timezone;
    }
    await user.save();

    // 生成 token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wallet');

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// 刷新 token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: '缺少 refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const newAccessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token 无效或已过期' });
  }
};
