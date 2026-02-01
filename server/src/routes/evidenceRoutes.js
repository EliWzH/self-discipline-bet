const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// 所有证据路由都需要认证
router.use(authenticate);

router.post('/submit', upload.array('images', 5), evidenceController.submitEvidence);
router.get('/:taskId', evidenceController.getEvidence);

module.exports = router;
