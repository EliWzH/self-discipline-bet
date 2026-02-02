import { useEffect, useState } from 'react';
import taskService from '../services/taskService';
import evidenceService from '../services/evidenceService';
import friendService from '../services/friendService';
import templateService from '../services/templateService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_COLORS, TASK_CATEGORIES, TASK_STATUS } from '../utils/constants';
import { formatDate, getTimeRemaining } from '../utils/dateFormatter';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [tasksToJudge, setTasksToJudge] = useState([]);
  const [friends, setFriends] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [judgeTask, setJudgeTask] = useState(null);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchTasksToJudge();
      fetchFriends();
      fetchTemplates();
    }
  }, [user?._id]);

  const fetchFriends = async () => {
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('获取好友列表失败');
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('获取模板列表失败');
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (error) {
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksToJudge = async () => {
    try {
      const data = await evidenceService.getTasksToJudge();
      setTasksToJudge(data);
    } catch (error) {
      console.error('获取待审判任务失败');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await taskService.createTask(taskData);
      toast.success('任务创建成功！任务已自动开始');
      setShowCreateModal(false);
      fetchTasks();
      fetchTasksToJudge();
    } catch (error) {
      toast.error(error.response?.data?.error || '创建任务失败');
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      await templateService.createTemplate(templateData);
      toast.success('模板创建成功！');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || '创建模板失败');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('确定要删除这个模板吗？')) return;
    try {
      await templateService.deleteTemplate(templateId);
      toast.success('模板已删除');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || '删除模板失败');
    }
  };

  // 已移除 handleStartTask - 任务创建后直接进入进行中状态

  const handleSubmitEvidence = async (taskId, description, images) => {
    try {
      await evidenceService.submitEvidence(taskId, description, images);
      toast.success('证据提交成功！等待好友审判');
      setShowEvidenceModal(false);
      setSelectedTask(null);
      fetchTasks();
      fetchTasksToJudge();
    } catch (error) {
      toast.error(error.response?.data?.error || '提交证据失败');
    }
  };

  const handleJudge = async (taskId, decision, comment) => {
    try {
      await evidenceService.judgeTask(taskId, decision, comment);
      toast.success('判决提交成功！');
      setShowJudgeModal(false);
      setJudgeTask(null);
      fetchTasks();
      fetchTasksToJudge();
    } catch (error) {
      toast.error(error.response?.data?.error || '判决提交失败');
    }
  };

  const handleArchiveTask = async (taskId) => {
    try {
      await taskService.archiveTask(taskId);
      toast.success('任务已存档');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || '存档任务失败');
    }
  };

  if (loading) {
    return <div className="text-white">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">任务列表</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            📋 模板管理
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            创建任务
          </button>
        </div>
      </div>

      {/* 我需要审判的任务 */}
      {tasksToJudge.length > 0 && (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">
            👨‍⚖️ 我需要审判的任务 ({tasksToJudge.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasksToJudge.map((task) => (
              <div
                key={task._id}
                className="bg-dark-card rounded-lg p-5 border border-purple-500/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <p className="text-purple-300 text-sm mt-1">
                      任务创建者: {task.userId?.username || '未知用户'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs text-white ${
                      STATUS_COLORS[task.status]
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                {task.description && (
                  <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                )}

                <div className="space-y-1 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">赌注:</span>
                    <span className="text-yellow-400 font-semibold">¥{task.betAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">截止时间:</span>
                    <span className="text-white">{formatDate(task.deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">剩余时间:</span>
                    <span className="text-white">{getTimeRemaining(task.deadline)}</span>
                  </div>
                </div>

                {task.status === TASK_STATUS.SUBMITTED && task.judgeStatus === 'pending' && (
                  <button
                    onClick={() => {
                      setJudgeTask(task);
                      setShowJudgeModal(true);
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
                  >
                    审判任务
                  </button>
                )}

                {task.status === TASK_STATUS.IN_PROGRESS && (
                  <div className="py-2 px-3 bg-blue-900/30 text-blue-300 text-center rounded-lg text-sm">
                    ⏳ 等待用户提交证据
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-white">我的任务</h2>

      {tasks.length === 0 ? (
        <div className="bg-dark-card rounded-lg p-12 text-center border border-dark-border">
          <p className="text-gray-400 mb-4">还没有任务</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            创建第一个任务
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-dark-card rounded-lg p-6 border border-dark-border hover:border-dark-hover transition relative"
            >
              {/* 存档按钮 - 只在失败或完成的任务显示 */}
              {(task.status === TASK_STATUS.FAILED || task.status === TASK_STATUS.COMPLETED) && (
                <button
                  onClick={() => handleArchiveTask(task._id)}
                  className="absolute top-4 right-4 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition"
                  title="存档任务"
                >
                  📁 存档
                </button>
              )}

              <div className="flex items-start justify-between mb-4 pr-16">
                <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs text-white ${
                    STATUS_COLORS[task.status]
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {task.description && (
                <p className="text-gray-400 text-sm mb-4">{task.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">类别:</span>
                  <span className="text-white">{task.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">赌注:</span>
                  <span className="text-yellow-400 font-semibold">¥{task.betAmount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">截止时间:</span>
                  <span className="text-white">{formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">剩余时间:</span>
                  <span className="text-white">{getTimeRemaining(task.deadline)}</span>
                </div>
                {task.judgeUserId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">审判者:</span>
                    <span className="text-white">{task.judgeUserId.username || '好友'}</span>
                  </div>
                )}
                {task.judgeStatus && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">审判状态:</span>
                    <span className={`font-semibold ${
                      task.judgeStatus === 'approved' ? 'text-green-400' :
                      task.judgeStatus === 'rejected' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {task.judgeStatus === 'approved' ? '已通过' :
                       task.judgeStatus === 'rejected' ? '已拒绝' :
                       '待审判'}
                    </span>
                  </div>
                )}
              </div>

              {/* 好友判决评论 */}
              {task.judgeComment && (
                <div className="p-3 rounded-lg mb-4 bg-purple-900/30">
                  <p className="text-gray-300 text-sm font-semibold mb-1">审判评论:</p>
                  <p className="text-gray-400 text-sm">{task.judgeComment}</p>
                </div>
              )}

              {/* 审判结果 */}
              {task.judgement && (
                <div className={`p-3 rounded-lg mb-4 ${
                  task.judgement.result === '通过' ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">
                      {task.judgement.result === '通过' ? '✅ 审判通过' : '❌ 审判未通过'}
                    </span>
                    <span className="text-white">得分: {task.judgement.score}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{task.judgement.feedback}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex space-x-3">
                {task.status === TASK_STATUS.IN_PROGRESS && (
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowEvidenceModal(true);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    提交证据
                  </button>
                )}

                {/* 如果当前用户是判决人且任务已提交，显示判决按钮 */}
                {task.status === TASK_STATUS.SUBMITTED &&
                 task.judgeUserId &&
                 task.judgeUserId._id === user?._id &&
                 task.judgeStatus === 'pending' && (
                  <button
                    onClick={() => {
                      setJudgeTask(task);
                      setShowJudgeModal(true);
                    }}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                  >
                    判决任务
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建任务模态框 */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
          onCreateTemplate={handleCreateTemplate}
          friends={friends}
          templates={templates}
        />
      )}

      {/* 模板管理模态框 */}
      {showTemplatesModal && (
        <TemplatesModal
          onClose={() => setShowTemplatesModal(false)}
          templates={templates}
          onDelete={handleDeleteTemplate}
        />
      )}

      {/* 判决任务模态框 */}
      {showJudgeModal && judgeTask && (
        <JudgeModal
          task={judgeTask}
          onClose={() => {
            setShowJudgeModal(false);
            setJudgeTask(null);
          }}
          onJudge={handleJudge}
        />
      )}

      {/* 提交证据模态框 */}
      {showEvidenceModal && selectedTask && (
        <SubmitEvidenceModal
          task={selectedTask}
          onClose={() => {
            setShowEvidenceModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleSubmitEvidence}
        />
      )}
    </div>
  );
};

// 创建任务模态框
const CreateTaskModal = ({ onClose, onCreate, onCreateTemplate, friends, templates }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '其他',
    betAmount: '',
    deadline: '',
    judgeUserId: ''
  });
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  // 重复任务相关状态
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatType, setRepeatType] = useState('none'); // 'none', 'daily', 'weekly', 'monthly'
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endRepeat, setEndRepeat] = useState('never'); // 'never', 'onDate', 'afterOccurrences'
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState(10);

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);

    if (templateId) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setFormData({
          ...formData,
          title: template.title,
          description: template.description || '',
          category: template.category,
          betAmount: template.betAmount,
          judgeUserId: template.judgeUserId?._id || ''
        });
      }
    }
  };

  const toggleDayOfWeek = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (saveAsTemplate) {
      if (!templateName.trim()) {
        alert('请输入模板名称');
        setLoading(false);
        return;
      }
      await onCreateTemplate({
        templateName,
        ...formData
      });
      setLoading(false);
      onClose();
    } else {
      const taskData = { ...formData };

      // 添加重复任务信息
      if (repeatType !== 'none' && !saveAsTemplate) {
        // 验证每周必须选择至少一天
        if (repeatType === 'weekly' && daysOfWeek.length === 0) {
          alert('请至少选择一天');
          setLoading(false);
          return;
        }

        taskData.isRecurring = true;
        taskData.recurrence = {
          frequency: repeatType,
          startTime: startTime,
          ...(repeatType === 'weekly' && { daysOfWeek }),
          ...(endRepeat === 'onDate' && endDate && { endDate }),
          ...(endRepeat === 'afterOccurrences' && { occurrences })
        };
        // 重复任务不需要 deadline
        delete taskData.deadline;
      }

      await onCreate(taskData);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">创建新任务</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 从模板选择 */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                从模板创建 (可选)
              </label>
              <select
                value={selectedTemplate}
                onChange={handleTemplateSelect}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">不使用模板</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.templateName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 保存为模板选项 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveAsTemplate"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-dark-bg border-dark-border rounded focus:ring-blue-500"
            />
            <label htmlFor="saveAsTemplate" className="text-sm text-gray-300">
              保存为模板（不创建任务）
            </label>
          </div>

          {/* 模板名称 */}
          {saveAsTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                模板名称 *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 每日运动任务"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              任务标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 每天跑步 5 公里"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="详细描述任务要求..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              任务类别 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              赌注金额 * (¥1-10000)
            </label>
            <input
              type="number"
              value={formData.betAmount}
              onChange={(e) => setFormData({ ...formData, betAmount: e.target.value })}
              required
              min="1"
              max="10000"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="押注金额"
            />
          </div>

          {!saveAsTemplate && repeatType === 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                截止时间 *
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required={repeatType === 'none'}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 重复选项 */}
          {!saveAsTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                重复
              </label>
              <select
                value={repeatType}
                onChange={(e) => {
                  setRepeatType(e.target.value);
                  if (e.target.value === 'weekly' && daysOfWeek.length === 0) {
                    setDaysOfWeek([new Date().getDay()]); // 默认选中今天
                  }
                }}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
              </select>
            </div>
          )}

          {/* 每周选择星期几 */}
          {!saveAsTemplate && repeatType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                重复日期
              </label>
              <div className="grid grid-cols-7 gap-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`py-2 px-3 rounded-lg text-sm transition ${
                      daysOfWeek.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-bg text-gray-400 border border-dark-border hover:border-gray-500'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 开始时间 - 仅重复任务显示 */}
          {!saveAsTemplate && repeatType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                每日开始时间
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 结束重复 */}
          {!saveAsTemplate && repeatType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                结束重复
              </label>
              <select
                value={endRepeat}
                onChange={(e) => setEndRepeat(e.target.value)}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="never">永不</option>
                <option value="onDate">在日期</option>
                <option value="afterOccurrences">在次数后</option>
              </select>

              {endRepeat === 'onDate' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="结束日期"
                />
              )}

              {endRepeat === 'afterOccurrences' && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={occurrences}
                    onChange={(e) => setOccurrences(parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="重复次数"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    将生成 {occurrences} 个任务实例
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              选择审判好友 *
            </label>
            <select
              value={formData.judgeUserId}
              onChange={(e) => setFormData({ ...formData, judgeUserId: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择好友</option>
              {friends.map((friend) => (
                <option key={friend._id} value={friend._id}>
                  {friend.username} ({friend.email})
                </option>
              ))}
            </select>
            {friends.length === 0 && (
              <p className="text-red-400 text-xs mt-1">
                你还没有好友，请先在"好友管理"页面添加好友
              </p>
            )}
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {loading ? (saveAsTemplate ? '保存中...' : '创建中...') : (saveAsTemplate ? '保存模板' : '创建任务')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 提交证据模态框
const SubmitEvidenceModal = ({ task, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== fileArray.length) {
      toast.error('只能上传图片文件');
    }

    if (imageFiles.length + images.length > 5) {
      toast.error('最多只能上传 5 张图片');
      return;
    }

    setImages([...images, ...imageFiles]);
  };

  const handleImageChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }
    setLoading(true);
    await onSubmit(task._id, description, images);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-2">提交任务证据</h2>
        <p className="text-gray-400 mb-6">{task.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              证据描述 *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="详细描述你是如何完成任务的..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              上传图片 * (最多 5 张)
            </label>

            {/* 拖放上传区域 */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-dark-border bg-dark-bg hover:border-blue-400'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-white mb-1">
                  {dragOver ? '松开鼠标上传文件' : '拖放图片到这里'}
                </p>
                <p className="text-gray-400 text-sm mb-1">或点击选择文件</p>
                <p className="text-gray-500 text-xs">
                  支持 JPG、PNG、WEBP 格式，每张最大 5MB
                </p>
              </div>
            </div>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`预览 ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {loading ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 判决任务模态框
const JudgeModal = ({ task, onClose, onJudge }) => {
  const [decision, setDecision] = useState(''); // 'approved' or 'rejected'
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // 图片静态资源URL（去除/api后缀）
  const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace('/api', '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision) {
      toast.error('请选择判决结果');
      return;
    }
    if (!comment.trim()) {
      toast.error('请填写判决评论');
      return;
    }
    setLoading(true);
    await onJudge(task._id, decision, comment);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-2">审判任务</h2>
        <p className="text-gray-400 mb-6">{task.title}</p>

        {/* 显示任务描述 */}
        {task.description && (
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-2">任务描述:</h3>
            <p className="text-gray-400">{task.description}</p>
          </div>
        )}

        {/* 显示证据 */}
        {task.evidence && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-2">证据描述:</h3>
            <p className="text-gray-400 mb-4">{task.evidence.description}</p>

            {task.evidence.images && task.evidence.images.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2">证据图片:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {task.evidence.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${API_URL}/${img.path.replace(/^\//, '')}`}
                      alt={`证据 ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => window.open(`${API_URL}/${img.path.replace(/^\//, '')}`, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              判决结果 *
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  decision === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-dark-bg text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✅ 通过
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  decision === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-dark-bg text-gray-400 hover:bg-gray-700'
                }`}
              >
                ❌ 拒绝
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              判决评论 *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="说明你的判决理由..."
            />
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {loading ? '提交中...' : '提交判决'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 模板管理模态框
const TemplatesModal = ({ onClose, templates, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-card rounded-lg p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">模板管理</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">还没有任何模板</p>
            <p className="text-gray-500 text-sm">
              在创建任务时勾选"保存为模板"即可创建模板
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template._id} className="bg-dark-bg rounded-lg p-5 border border-dark-border hover:border-dark-hover transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {template.templateName}
                    </h3>
                    <p className="text-gray-400 text-sm">{template.title}</p>
                  </div>
                </div>

                {template.description && (
                  <p className="text-gray-500 text-sm mb-3">{template.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">类别:</span>
                    <span className="text-white">{template.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">赌注:</span>
                    <span className="text-yellow-400 font-semibold">¥{template.betAmount}</span>
                  </div>
                  {template.judgeUserId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">审判者:</span>
                      <span className="text-white">{template.judgeUserId.username}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onDelete(template._id)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                >
                  删除模板
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
