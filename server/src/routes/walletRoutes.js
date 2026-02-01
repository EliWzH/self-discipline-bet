const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// 所有钱包路由都需要认证
router.use(authenticate);

router.get('/', walletController.getWallet);
router.post('/deposit', walletController.deposit);
router.get('/transactions', walletController.getTransactions);

module.exports = router;
