# 🎯 自律赌注平台

一个帮助你通过"赌注"机制激励自律目标完成的全栈 Web 应用。使用 Claude AI 自动审判任务完成情况。

## ✨ 功能特性

- 👤 **用户认证系统** - 邮箱注册/登录，JWT Token 认证
- 💼 **虚拟钱包** - 初始赠送 ¥1000，支持充值
- 📋 **任务管理** - 创建任务、设置赌注、管理任务状态
- 📸 **证据提交** - 上传图片和文字描述证明任务完成
- 🤖 **AI 审判** - 使用 Claude API 自动评判任务完成情况
- 📊 **数据统计** - 仪表板展示完成率、锁定金额、捐赠金额
- 🌙 **深色主题** - 现代化的深色界面设计

## 🛠 技术栈

### 前端
- React 18
- React Router v7
- Tailwind CSS
- Axios

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT 认证
- Multer (文件上传)
- Sharp (图片处理)
- Claude API (@anthropic-ai/sdk)

## 📦 安装步骤

### 前置要求

- Node.js >= 16.x
- MongoDB Atlas 账户（或本地 MongoDB）
- Anthropic Claude API Key

### 1. 克隆项目

```bash
cd ~/Desktop/self-discipline-bet-platform
```

### 2. 后端设置

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env
```

编辑 `server/.env` 文件，填入配置：

```env
# MongoDB Atlas 连接字符串
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/self-discipline-bet?retryWrites=true&w=majority

# JWT 密钥（使用下方命令生成）
JWT_SECRET=<生成的密钥>
JWT_REFRESH_SECRET=<生成的密钥>

# Claude API Key
CLAUDE_API_KEY=sk-ant-xxxxx

# 服务器配置
PORT=5000
NODE_ENV=development
```

生成 JWT 密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 前端设置

```bash
# 进入前端目录
cd ../client

# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env
```

编辑 `client/.env` 文件：

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 运行项目

### 启动后端

```bash
cd server
npm run dev
```

后端将在 http://localhost:5000 运行

### 启动前端

```bash
cd client
npm start
```

前端将在 http://localhost:3000 运行

## 📖 使用指南

### 1. 注册账户

- 访问 http://localhost:3000/register
- 填写用户名、邮箱、密码
- 注册成功后自动获得 ¥1000 初始金额

### 2. 创建任务

- 在任务列表页面点击"创建任务"
- 填写任务信息：
  - 任务标题
  - 任务描述（可选）
  - 任务类别（运动健身、学习进修等）
  - 赌注金额（1-10000）
  - 截止时间
- 创建后，赌注金额将被锁定

### 3. 开始任务

- 点击"开始任务"按钮
- 任务状态变为"进行中"

### 4. 提交证据

- 点击"提交证据"按钮
- 填写详细的完成描述
- 上传 1-5 张证明图片（支持 JPG、PNG、WEBP）
- 提交后任务状态变为"已提交"

### 5. AI 审判

- 点击"请求 AI 审判"按钮
- Claude AI 将根据任务要求和提交的证据进行评判
- 审判通过（分数 ≥ 60）：返还赌注
- 审判未通过（分数 < 60）：扣除赌注，计入"捐赠"

### 6. 查看统计

- 仪表板显示：
  - 总锁定赌注
  - 任务完成率
  - 累计"捐赠"金额
  - 最近任务列表

## 📁 项目结构

```
self-discipline-bet-platform/
├── client/                  # React 前端
│   ├── public/
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── contexts/        # Context 状态管理
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 服务
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── server/                  # Node.js 后端
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── models/          # MongoDB 模型
│   │   ├── routes/          # API 路由
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 服务层
│   │   └── utils/           # 工具函数
│   ├── uploads/             # 上传文件存储
│   └── package.json
│
└── README.md
```

## 🔑 API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/refresh` - 刷新 Token

### 任务
- `POST /api/tasks` - 创建任务
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取任务详情
- `PUT /api/tasks/:id/start` - 开始任务
- `GET /api/tasks/stats` - 获取统计数据

### 证据
- `POST /api/evidence/submit` - 提交证据
- `GET /api/evidence/:taskId` - 获取证据

### 审判
- `POST /api/judgement/judge/:taskId` - 触发 AI 审判
- `GET /api/judgement/result/:taskId` - 获取审判结果

### 钱包
- `GET /api/wallet` - 获取钱包信息
- `POST /api/wallet/deposit` - 虚拟充值
- `GET /api/wallet/transactions` - 获取交易历史

## 🔒 安全特性

- ✅ 密码使用 bcrypt 加密（12 轮）
- ✅ JWT Token 认证（Access 15min + Refresh 7d）
- ✅ 文件上传类型和大小限制
- ✅ API 速率限制（15 分钟 100 次请求）
- ✅ 输入验证（前后端双重）
- ✅ XSS 防护

## 🐛 常见问题

### Q: MongoDB 连接失败？
A: 检查 MongoDB Atlas 连接字符串是否正确，确保网络 IP 已加入白名单。

### Q: Claude API 调用失败？
A: 检查 API Key 是否有效，是否有足够的配额。

### Q: 图片上传失败？
A: 确保图片格式为 JPG/PNG/WEBP，单个文件不超过 5MB。

### Q: Token 过期怎么办？
A: 前端会自动使用 Refresh Token 刷新 Access Token，无需手动处理。

## 📝 待优化功能

- [ ] 添加任务提醒功能
- [ ] 支持团队任务和好友对赌
- [ ] 添加任务标签和搜索功能
- [ ] 数据可视化图表
- [ ] 接入真实支付系统
- [ ] 移动端适配

## 📄 许可证

MIT License

## 🙏 致谢

- [Anthropic Claude AI](https://www.anthropic.com/) - AI 审判引擎
- [Tailwind CSS](https://tailwindcss.com/) - UI 样式框架
- [React](https://react.dev/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架

---

**注意**: 本项目仅供学习和演示使用，虚拟钱包不涉及真实资金交易。
