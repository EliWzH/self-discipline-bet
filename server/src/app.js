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
const maintenanceRoutes = require('./routes/maintenanceRoutes');

const app = express();

// CORS 配置
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
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
    max: 1000, // 提高限制到 1000 次
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health'
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
app.use('/api/maintenance', maintenanceRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app;
