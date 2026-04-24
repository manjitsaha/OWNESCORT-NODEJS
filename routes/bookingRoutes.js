// const express = require('express');
// const { body, query, param } = require('express-validator');
// const {
//   createBooking,
//   getMyBookings,
//   updateBookingStatus,
//   validate // Import the validate utility
// } = require('../controllers/bookingController');
// const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// const router = express.Router();

// router.post(
//   '/',
//   protect,
//   authorizeRoles('Customer'),
//   [
//     body('escortId').isMongoId().withMessage('Invalid Escort ID'),
//     body('bookingDate').isISO8601().toDate().withMessage('Invalid booking date format'),
//     body('notes').optional().isString().trim().escape(), // Sanitize notes
//   ],
//   validate,
//   createBooking
// );

// router.get(
//   '/my',
//   protect,
//   [
//     query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
//     query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
//     query('status').optional().isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed']).withMessage('Invalid status filter'),
//   ],
//   validate,
//   getMyBookings
// );

// router.put(
//   '/:id/status',
//   protect,
//   authorizeRoles('Escort', 'Broker', 'Admin'),
//   [
//     param('id').isMongoId().withMessage('Invalid Booking ID'),
//     body('status').isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed']).withMessage('Invalid status'),
//   ],
//   validate,
//   updateBookingStatus
// );

// module.exports = router;

const express = require('express');
const { body, query, param } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getAvailableSlots,
  validate
} = require('../controllers/bookingController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get available booking slots
router.post(
  '/available-slots',
  [
    body('escortId').isMongoId().withMessage('Invalid Escort ID.'),
    body('date').isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD or ISO 8601.'),
    body('serviceHours').isNumeric().withMessage('Service hours must be a valid number.'),
  ],
  validate,
  getAvailableSlots
);

// Create a new booking
router.post(
  '/',
  protect,
  authorizeRoles(['Customer']),
  [
    body('escortId').isMongoId().withMessage('Invalid Escort ID.'),
    body('startTime').isISO8601().toDate().withMessage('Invalid start time format. Use ISO 8601.'),
    body('serviceHours').isNumeric().withMessage('Service hours must be a valid number.'),
    body('notes').optional().isString().trim().escape().isLength({ max: 500 }).withMessage('Notes must be a string and max 500 characters.'),
  ],
  validate,
  createBooking
);

// Get bookings for the logged-in user
router.get(
  '/my',
  protect,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer.'),
    query('status').optional().isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed']).withMessage('Invalid status filter.'),
  ],
  validate,
  getMyBookings
);

// Update booking status
router.put(
  '/:id/status',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Booking ID.'),
    body('status').isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed']).withMessage('Invalid status.'),
  ],
  validate,
  updateBookingStatus
);

module.exports = router;