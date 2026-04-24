const express = require('express');
const { getCustomerProfile } = require('../controllers/customerController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get customer profile
router.get('/profile', protect, authorizeRoles(['Customer']), getCustomerProfile);

module.exports = router;
