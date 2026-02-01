const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const walletRoutes = require('./routes/walletRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const judgementRoutes = require('./routes/judgementRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();

// CORS 配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body 解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 限流（开发环境禁用）
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100,
    message: '请求过于频繁，请稍后再试'
  });
  app.use('/api/', limiter);
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务正常运行' });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/judgement', judgementRoutes);
app.use('/api/friends', friendRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app;
