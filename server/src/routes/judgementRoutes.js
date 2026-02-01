const express = require('express');
const router = express.Router();
const judgementController = require('../controllers/judgementController');
const { authenticate } = require('../middleware/auth');

// 所有审判路由都需要认证
router.use(authenticate);

router.post('/judge/:taskId', judgementController.judgeTask);
router.get('/result/:taskId', judgementController.getJudgementResult);
router.get('/tasks-to-judge', judgementController.getTasksToJudge);

module.exports = router;
