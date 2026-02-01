const User = require('../models/User');
const Invitation = require('../models/Invitation');

// 发送好友邀请
exports.sendInvite = async (req, res, next) => {
  try {
    const { email, message } = req.body;
    const fromUserId = req.user._id;

    // 验证邮箱
    if (!email) {
      return res.status(400).json({ error: '请输入邀请邮箱' });
    }

    // 查找目标用户
    const toUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!toUser) {
      return res.status(404).json({ error: '该邮箱未注册' });
    }

    // 不能添加自己
    if (toUser._id.equals(fromUserId)) {
      return res.status(400).json({ error: '不能添加自己为好友' });
    }

    // 检查是否已是好友
    const currentUser = await User.findById(fromUserId);
    const isFriend = currentUser.friends.some(f => f.equals(toUser._id));
    if (isFriend) {
      return res.status(400).json({ error: '已经是好友关系' });
    }

    // 检查是否有待处理的邀请
    const existingInvite = await Invitation.findOne({
      $or: [
        { fromUserId, toUserId: toUser._id, status: 'pending' },
        { fromUserId: toUser._id, toUserId: fromUserId, status: 'pending' }
      ]
    });
    if (existingInvite) {
      return res.status(400).json({ error: '已有待处理的好友邀请' });
    }

    // 创建邀请（7天过期）
    const invitation = new Invitation({
      fromUserId,
      toEmail: email.toLowerCase().trim(),
      toUserId: toUser._id,
      message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await invitation.save();

    await invitation.populate('fromUserId', 'username email');

    res.status(201).json({
      success: true,
      message: '邀请已发送',
      invitation
    });
  } catch (error) {
    next(error);
  }
};

// 接受邀请
exports.acceptInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const currentUserId = req.user._id;

    // 查找邀请
    const invitation = await Invitation.findById(inviteId);
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    // 验证接收人
    if (!invitation.toUserId.equals(currentUserId)) {
      return res.status(403).json({ error: '无权接受此邀请' });
    }

    // 验证状态和过期时间
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: '邀请已被处理' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: '邀请已过期' });
    }

    // 检查是否已是好友（防止重复接受）
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.some(f => f.equals(invitation.fromUserId));
    if (isFriend) {
      invitation.status = 'accepted';
      await invitation.save();
      return res.status(400).json({ error: '已经是好友关系' });
    }

    // 更新邀请状态
    invitation.status = 'accepted';
    await invitation.save();

    // 双向添加好友关系（原子操作）
    await User.findByIdAndUpdate(invitation.fromUserId, {
      $addToSet: { friends: invitation.toUserId }
    });
    await User.findByIdAndUpdate(invitation.toUserId, {
      $addToSet: { friends: invitation.fromUserId }
    });

    // 获取更新后的好友列表
    const updatedUser = await User.findById(currentUserId).populate('friends', 'username email');

    res.json({
      success: true,
      message: '已接受好友邀请',
      friends: updatedUser.friends
    });
  } catch (error) {
    next(error);
  }
};

// 拒绝邀请
exports.rejectInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.params;
    const currentUserId = req.user._id;

    // 查找邀请
    const invitation = await Invitation.findById(inviteId);
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    // 验证接收人
    if (!invitation.toUserId.equals(currentUserId)) {
      return res.status(403).json({ error: '无权拒绝此邀请' });
    }

    // 验证状态
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: '邀请已被处理' });
    }

    // 更新状态
    invitation.status = 'rejected';
    await invitation.save();

    res.json({
      success: true,
      message: '已拒绝邀请'
    });
  } catch (error) {
    next(error);
  }
};

// 获取好友列表
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('friends', 'username email');

    res.json({
      success: true,
      friends: user.friends || []
    });
  } catch (error) {
    next(error);
  }
};

// 获取收到的待处理邀请
exports.getPendingInvitations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const invitations = await Invitation.find({
      toUserId: userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('fromUserId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};

// 获取发送的邀请
exports.getSentInvitations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const invitations = await Invitation.find({
      fromUserId: userId
    })
      .populate('toUserId', 'username email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};

// 移除好友
exports.removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // 验证好友ID
    if (!friendId) {
      return res.status(400).json({ error: '请提供好友ID' });
    }

    // 检查是否是好友
    const user = await User.findById(userId);
    const isFriend = user.friends.some(f => f.toString() === friendId);

    if (!isFriend) {
      return res.status(400).json({ error: '该用户不是你的好友' });
    }

    // 双向移除好友关系
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({
      success: true,
      message: '已移除好友'
    });
  } catch (error) {
    next(error);
  }
};
