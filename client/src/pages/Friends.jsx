import { useEffect, useState } from 'react';
import friendService from '../services/friendService';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingInvitations(),
        friendService.getSentInvitations()
      ]);
      setFriends(friendsData);
      setPendingInvites(pendingData);
      setSentInvites(sentData);
    } catch (error) {
      toast.error('加载好友数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('请输入邮箱');
      return;
    }

    try {
      await friendService.sendInvite(inviteEmail);
      toast.success('邀请已发送！');
      setInviteEmail('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || '发送邀请失败');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await friendService.acceptInvite(inviteId);
      toast.success('已接受好友邀请！');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || '接受邀请失败');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await friendService.rejectInvite(inviteId);
      toast.success('已拒绝邀请');
      fetchData();
    } catch (error) {
      toast.error('拒绝邀请失败');
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`确定要移除好友 ${friendName} 吗？`)) {
      return;
    }

    try {
      await friendService.removeFriend(friendId);
      toast.success('已移除好友');
      fetchData();
    } catch (error) {
      toast.error('移除好友失败');
    }
  };

  if (loading) {
    return <div className="text-white">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">好友管理</h1>

      {/* 邀请好友表单 */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-white mb-4">邀请好友</h2>
        <form onSubmit={handleSendInvite} className="flex space-x-4">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="输入好友的邮箱地址"
            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            发送邀请
          </button>
        </form>
      </div>

      {/* 收到的邀请 */}
      {pendingInvites.length > 0 && (
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-semibold text-white mb-4">
            收到的邀请 ({pendingInvites.length})
          </h2>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg"
              >
                <div>
                  <p className="text-white font-semibold">
                    {invite.fromUserId?.username}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {invite.fromUserId?.email}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatDate(invite.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptInvite(invite._id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    接受
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite._id)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 好友列表 */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-white mb-4">
          我的好友 ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            还没有好友，快去邀请好友吧！
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg"
              >
                <div>
                  <p className="text-white font-semibold">{friend.username}</p>
                  <p className="text-gray-400 text-sm">{friend.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend._id, friend.username)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 发送的邀请 */}
      {sentInvites.length > 0 && (
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-semibold text-white mb-4">
            发送的邀请 ({sentInvites.length})
          </h2>
          <div className="space-y-3">
            {sentInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg"
              >
                <div>
                  <p className="text-white font-semibold">
                    {invite.toUserId?.username || invite.toEmail}
                  </p>
                  {invite.toUserId?.email && (
                    <p className="text-gray-400 text-sm">
                      {invite.toUserId.email}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {formatDate(invite.createdAt)}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      invite.status === 'accepted'
                        ? 'bg-green-600/30 text-green-400'
                        : invite.status === 'rejected'
                        ? 'bg-red-600/30 text-red-400'
                        : invite.status === 'expired'
                        ? 'bg-gray-600/30 text-gray-400'
                        : 'bg-yellow-600/30 text-yellow-400'
                    }`}
                  >
                    {invite.status === 'accepted'
                      ? '已接受'
                      : invite.status === 'rejected'
                      ? '已拒绝'
                      : invite.status === 'expired'
                      ? '已过期'
                      : '待处理'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
