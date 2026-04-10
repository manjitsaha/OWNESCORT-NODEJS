const express = require('express');
const router = express.Router();
const { getWalletBalance, deposit, withdraw } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getWalletBalance);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

module.exports = router;
