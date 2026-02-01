import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import walletService from '../../services/walletService';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const data = await walletService.getWallet();
      setWallet(data);
    } catch (error) {
      console.error('获取钱包失败:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* 顶部导航 */}
      <nav className="bg-dark-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-white">
                🎯 自律赌注
              </Link>
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition"
              >
                主页
              </Link>
              <Link
                to="/calendar"
                className="text-gray-300 hover:text-white transition"
              >
                日历
              </Link>
              <Link
                to="/friends"
                className="text-gray-300 hover:text-white transition"
              >
                好友管理
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              {/* 钱包余额 */}
              {wallet && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-gray-400">
                    余额: <span className="text-green-400 font-semibold">¥{wallet.balance}</span>
                  </div>
                  <div className="text-gray-400">
                    锁定: <span className="text-yellow-400 font-semibold">¥{wallet.lockedAmount}</span>
                  </div>
                </div>
              )}

              {/* 用户信息 */}
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <span className="text-white font-semibold">{user?.username}</span>
                  <span className="text-xs text-gray-400">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
