const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate } = require('../middleware/auth');

// 清理过去日期的任务（需要认证）
router.post('/clean-past-tasks', authenticate, maintenanceController.cleanPastTasks);

// 更新任务截止时间
router.post('/update-task-deadlines', authenticate, maintenanceController.updateTaskDeadlines);

module.exports = router;
