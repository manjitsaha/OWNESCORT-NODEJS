// const express = require('express');
// const { body, param } = require('express-validator');
// const {
//   submitReview,
//   getEscortReviews,
//   validate
// } = require('../controllers/reviewController');
// // FIX: Change 'authorize' to 'authorizeRoles' here
// const { protect, authorizeRoles } = require('../middlewares/authMiddleware'); // <--- CHANGE THIS LINE

// const router = express.Router();

// // Route for submitting a review
// router.post(
//   '/',
//   protect, // Must be logged in
//   authorizeRoles(['Customer']), // <--- AND CHANGE THIS CALL TO authorizeRoles
//   [
//     body('bookingId').isMongoId().withMessage('Invalid Booking ID.'),
//     body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
//     body('comment').optional().isString().trim().escape().isLength({ max: 500 }).withMessage('Comment must be a string and max 500 characters.'),
//   ],
//   validate,
//   submitReview
// );

// // Route for getting all reviews for a specific escort
// router.get(
//   '/escort/:id',
//   [
//     param('id').isMongoId().withMessage('Invalid Escort ID.'),
//   ],
//   validate,
//   getEscortReviews
// );

// module.exports = router;

const express = require('express');
const { body, param } = require('express-validator');
const {
  submitReview,
  getEscortReviews,
  validate
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware'); // Corrected import

const router = express.Router();

// Route for submitting a review
router.post(
  '/',
  protect, // Must be logged in
  authorizeRoles(['Customer']), // Only Customers can submit reviews
  [
    body('bookingId').isMongoId().withMessage('Invalid Booking ID.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('comment').optional().isString().trim().escape().isLength({ max: 500 }).withMessage('Comment must be a string and max 500 characters.'),
  ],
  validate,
  submitReview
);

// Route for getting all reviews for a specific escort
router.get(
  '/escort/:id',
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
  ],
  validate,
  getEscortReviews
);

module.exports = router;