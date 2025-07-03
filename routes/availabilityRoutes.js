const express = require('express');
const { body, param, query } = require('express-validator');
const {
  addAvailabilitySlot,
  removeAvailabilitySlot,
  getEscortAvailabilitySlots,
  validate // Import the validate utility
} = require('../controllers/availabilityController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to add an availability slot for a specific escort
// Auth: Escort (for self), Broker (for assigned), Admin (for any)
router.post(
  '/:escortId/slots',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('escortId').isMongoId().withMessage('Invalid Escort ID.'),
    body('startTime').isISO8601().toDate().withMessage('Invalid start time format. Use ISO 8601 (e.g., 2025-06-01T10:00:00Z).'),
    body('endTime').isISO8601().toDate().withMessage('Invalid end time format. Use ISO 8601 (e.g., 2025-06-01T12:00:00Z).'),
    body('notes').optional().isString().trim().escape().isLength({ max: 200 }).withMessage('Notes must be a string and max 200 characters.'),
  ],
  validate,
  addAvailabilitySlot
);

// Route to remove an availability slot for a specific escort
// Auth: Escort (for self), Broker (for assigned), Admin (for any)
router.delete(
  '/:escortId/slots/:slotId',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('escortId').isMongoId().withMessage('Invalid Escort ID.'),
    param('slotId').isMongoId().withMessage('Invalid Slot ID.'),
  ],
  validate,
  removeAvailabilitySlot
);

// Route to get all availability slots for a specific escort
// Access: Public (Customers need to see this to book)
router.get(
  '/:escortId/slots',
  [
    param('escortId').isMongoId().withMessage('Invalid Escort ID.'),
    query('showPast').optional().isBoolean().withMessage('showPast must be a boolean (true/false).'),
  ],
  validate,
  getEscortAvailabilitySlots
);

module.exports = router;