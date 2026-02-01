import { useEffect, useState } from 'react';
import taskService from '../services/taskService';
import walletService from '../services/walletService';
import { Link } from 'react-router-dom';
import { STATUS_COLORS } from '../utils/constants';
import { getTimeRemaining } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsData, walletData, tasksData] = await Promise.all([
        taskService.getStats(),
        walletService.getWallet(),
        taskService.getTasks()
      ]);

      setStats(statsData);
      setWallet(walletData);
      setRecentTasks(tasksData.slice(0, 5));
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">仪表板</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">总锁定赌注</p>
              <p className="text-3xl font-bold text-yellow-400 mt-2">
                ¥{wallet?.lockedAmount || 0}
              </p>
            </div>
            <div className="text-4xl">🔒</div>
          </div>
        </div>

        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">任务完成率</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {stats?.completionRate || 0}%
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            完成 {stats?.completedTasks || 0} / {stats?.totalTasks || 0} 个任务
          </p>
        </div>

        <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">累计"捐赠"</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                ¥{wallet?.totalDonated || 0}
              </p>
            </div>
            <div className="text-4xl">💸</div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            失败 {stats?.failedTasks || 0} 个任务
          </p>
        </div>
      </div>

      {/* 最近任务 */}
      <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">最近任务</h2>
          <Link
            to="/tasks"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            查看全部 →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">还没有任务</p>
            <Link
              to="/tasks"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              创建第一个任务
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-white font-medium">{task.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs text-white ${
                        STATUS_COLORS[task.status]
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{task.category}</span>
                    <span>赌注: ¥{task.betAmount}</span>
                    <span>{getTimeRemaining(task.deadline)}</span>
                  </div>
                </div>

                <Link
                  to="/tasks"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                >
                  查看详情
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
