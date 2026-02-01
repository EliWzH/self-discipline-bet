import { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import { useToast } from '../contexts/ToastContext';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  const toast = useToast();

  useEffect(() => {
    fetchTasks();
  }, [currentDate, view]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let params = {};

      if (view === 'month') {
        params.month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const data = await taskService.getTasks(params);
      setTasks(data);
    } catch (error) {
      toast.error('获取任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取任务状态颜色
  const getTaskColor = (task) => {
    const today = new Date();
    const deadline = new Date(task.deadline);
    const isToday =
      deadline.getDate() === today.getDate() &&
      deadline.getMonth() === today.getMonth() &&
      deadline.getFullYear() === today.getFullYear();

    if (isToday && task.status === '进行中') {
      return 'bg-orange-500 text-white';
    }

    switch (task.judgeStatus) {
      case 'approved':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // 导航控制
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 获取标题文本
  const getTitle = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (view === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">任务日历</h1>

          {/* 视图切换按钮 */}
          <div className="flex items-center gap-2 bg-dark-card rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded transition ${view === 'day' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              日
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded transition ${view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              周
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded transition ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              月
            </button>
          </div>

          {/* 导航控制 */}
          <div className="flex items-center gap-4">
            <button
              onClick={navigatePrev}
              className="px-4 py-2 bg-dark-card text-white rounded hover:bg-gray-700"
            >
              ←
            </button>
            <span className="text-xl text-white font-semibold min-w-[200px] text-center">{getTitle()}</span>
            <button
              onClick={navigateNext}
              className="px-4 py-2 bg-dark-card text-white rounded hover:bg-gray-700"
            >
              →
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              今天
            </button>
          </div>
        </div>

        {/* 渲染对应视图 */}
        {view === 'day' && <DayView currentDate={currentDate} tasks={tasks} getTaskColor={getTaskColor} />}
        {view === 'week' && <WeekView currentDate={currentDate} tasks={tasks} getTaskColor={getTaskColor} />}
        {view === 'month' && <MonthView currentDate={currentDate} tasks={tasks} getTaskColor={getTaskColor} />}

        {/* 图例 */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-400">进行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-400">即将到期</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-gray-400">待判决</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-400">已通过</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-400">已拒绝</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 日视图组件
const DayView = ({ currentDate, tasks, getTaskColor }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTasksForHour = (hour) => {
    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      const isSameDay =
        deadline.getDate() === currentDate.getDate() &&
        deadline.getMonth() === currentDate.getMonth() &&
        deadline.getFullYear() === currentDate.getFullYear();
      return isSameDay && deadline.getHours() === hour;
    });
  };

  return (
    <div className="bg-dark-card rounded-lg overflow-hidden">
      <div className="max-h-[700px] overflow-y-auto">
        {hours.map(hour => {
          const hourTasks = getTasksForHour(hour);
          return (
            <div key={hour} className="flex border-b border-dark-border">
              {/* 时间列 */}
              <div className="w-16 flex-shrink-0 py-1 px-2 text-gray-400 text-xs font-semibold border-r border-dark-border">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* 任务列 */}
              <div className="flex-1 py-1 px-2 min-h-[35px]">
                {hourTasks.map((task, idx) => (
                  <div
                    key={task._id}
                    className={`mb-1 px-2 py-1 rounded text-xs ${getTaskColor(task)}`}
                  >
                    <div className="font-semibold">{task.title}</div>
                    <div className="text-xs opacity-90">
                      {new Date(task.deadline).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 获取一周的开始日期（周日）
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// 周视图组件
const WeekView = ({ currentDate, tasks, getTaskColor }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const getTasksForDayAndHour = (day, hour) => {
    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      const isSameDay =
        deadline.getDate() === day.getDate() &&
        deadline.getMonth() === day.getMonth() &&
        deadline.getFullYear() === day.getFullYear();
      return isSameDay && deadline.getHours() === hour;
    });
  };

  return (
    <div className="bg-dark-card rounded-lg overflow-hidden">
      {/* 星期标题 */}
      <div className="flex border-b border-dark-border bg-dark-bg">
        <div className="w-16 flex-shrink-0"></div>
        {weekDays.map((day, idx) => {
          const isToday =
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear();

          return (
            <div key={idx} className="flex-1 text-center p-2 border-r border-dark-border">
              <div className={`text-sm ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][idx]}
              </div>
              <div className={`text-lg font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 小时网格 */}
      <div className="max-h-[700px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="flex border-b border-dark-border">
            {/* 时间列 */}
            <div className="w-14 flex-shrink-0 py-1 px-1 text-gray-400 text-xs border-r border-dark-border">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* 每天的任务列 */}
            {weekDays.map((day, dayIdx) => {
              const dayTasks = getTasksForDayAndHour(day, hour);
              return (
                <div key={dayIdx} className="flex-1 py-1 px-1 min-h-[30px] border-r border-dark-border">
                  {dayTasks.map(task => (
                    <div
                      key={task._id}
                      className={`mb-1 px-1 py-0.5 rounded text-xs truncate ${getTaskColor(task)}`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// 月视图组件
const MonthView = ({ currentDate, tasks, getTaskColor }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getTasksForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      return taskDateStr === dateStr;
    });
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length > 0) {
      setSelectedDate(day);
      setShowDayModal(true);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <>
      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
          <div key={idx} className="text-center text-gray-400 font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const today = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-32 p-2 rounded-lg border-2 transition cursor-pointer
                ${day ? 'bg-dark-card hover:bg-gray-700' : 'bg-transparent'}
                ${today ? 'border-blue-500' : 'border-dark-border'}
                ${dayTasks.length > 0 ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {day && (
                <>
                  <div className={`text-sm font-bold mb-2 ${today ? 'text-blue-400' : 'text-white'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task, taskIdx) => (
                      <div
                        key={taskIdx}
                        className={`text-xs px-2 py-1 rounded truncate ${getTaskColor(task)}`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-400 px-2">
                        +{dayTasks.length - 2} 更多
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 某天任务详情弹窗 */}
      {showDayModal && selectedDate && (
        <DayTasksModal
          date={selectedDate}
          month={currentDate.getMonth() + 1}
          year={currentDate.getFullYear()}
          tasks={getTasksForDay(selectedDate)}
          onClose={() => setShowDayModal(false)}
          getTaskColor={getTaskColor}
        />
      )}
    </>
  );
};

// 某天任务详情弹窗
const DayTasksModal = ({ date, month, year, tasks, onClose, getTaskColor }) => {
  const dateStr = `${year}年${month}月${date}日`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-card rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{dateStr} 的任务</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task._id} className="bg-dark-bg rounded-lg p-4 hover:bg-gray-700 transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                <span className={`px-3 py-1 rounded text-sm ${getTaskColor(task)}`}>
                  {task.status}
                </span>
              </div>
              {task.description && (
                <p className="text-gray-400 text-sm mb-2">{task.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>赌注: ¥{task.betAmount}</span>
                <span>类别: {task.category}</span>
                <span>截止: {new Date(task.deadline).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
