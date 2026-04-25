const express = require('express');
const { getCustomerProfile, editCustomerProfile } = require('../controllers/customerController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get customer profile
router.get('/profile', protect, authorizeRoles(['Customer']), getCustomerProfile);

// Edit customer profile
router.put('/profile', protect, authorizeRoles(['Customer']), editCustomerProfile);

module.exports = router;
