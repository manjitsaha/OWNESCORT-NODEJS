const express = require('express');
const { param, query } = require('express-validator');
const {
  getBookingMessages,
  validate // Import the validate utility
} = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware'); // authorizeRoles is not needed here if all authorized roles for booking can see messages

const router = express.Router();

// Route to get historical messages for a specific booking chat
// Auth: Authenticated user who is involved in the booking (customer or escort) or is a broker/admin
router.get(
  '/booking/:bookingId',
  protect, // User must be authenticated
  [
    param('bookingId').isMongoId().withMessage('Invalid Booking ID.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer.'),
  ],
  validate,
  getBookingMessages
);

module.exports = router;