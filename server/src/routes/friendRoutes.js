const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authenticate } = require('../middleware/auth');

// 所有好友路由都需要认证
router.use(authenticate);

router.post('/invite', friendController.sendInvite);
router.post('/accept/:inviteId', friendController.acceptInvite);
router.post('/reject/:inviteId', friendController.rejectInvite);
router.get('/', friendController.getFriends);
router.get('/invitations/pending', friendController.getPendingInvitations);
router.get('/invitations/sent', friendController.getSentInvitations);
router.delete('/:friendId', friendController.removeFriend);

module.exports = router;
