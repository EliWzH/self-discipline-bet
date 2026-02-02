const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// 所有任务路由都需要认证
router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getStats);

// 模板相关路由 (必须在 /:id 之前)
router.get('/templates/list', taskController.getTemplates);
router.post('/templates/create', taskController.createTemplate);
router.post('/templates/:id/use', taskController.createTaskFromTemplate);
router.delete('/templates/:id', taskController.deleteTemplate);

router.get('/:id', taskController.getTaskById);
router.put('/:id/start', taskController.startTask);
router.put('/:id/archive', taskController.archiveTask);
router.put('/:id/unarchive', taskController.unarchiveTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
