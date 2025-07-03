// const asyncHandler = require('express-async-handler');
// const { validationResult } = require('express-validator');
// const Review = require('../models/Review');
// const User = require('../models/User'); // To update escort ratings
// const Booking = require('../models/Booking'); // To check booking status and mark as reviewed

// // Utility to handle validation errors (ensure this is present or shared)
// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (errors.isEmpty()) {
//     return next();
//   }
//   const extractedErrors = [];
//   errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

//   return res.status(422).json({
//     errors: extractedErrors,
//   });
// };


// // @desc    Submit a review for a completed booking
// // @route   POST /api/reviews
// // @access  Private (Customer only)
// const submitReview = asyncHandler(async (req, res) => {
//   const { bookingId, rating, comment } = req.body;
//   const customerId = req.user._id; // ID of the logged-in customer

//   // 1. Check if the user is a Customer
//   if (req.user.role !== 'Customer') {
//     res.status(403);
//     throw new Error('Only customers can submit reviews.');
//   }

//   // 2. Find the booking and ensure it exists
//   const booking = await Booking.findById(bookingId);

//   if (!booking) {
//     res.status(404);
//     throw new Error('Booking not found.');
//   }

//   // 3. Validate that the logged-in customer is the one who made this booking
//   if (booking.customer.toString() !== customerId.toString()) {
//     res.status(403);
//     throw new Error('Not authorized to review this booking. You did not make this booking.');
//   }

//   // 4. Ensure the booking status is 'Completed'
//   if (booking.status !== 'Completed') {
//     res.status(400);
//     throw new Error(`Cannot review a booking with status "${booking.status}". Only "Completed" bookings can be reviewed.`);
//   }

//   // 5. Ensure the booking has not been reviewed already
//   if (booking.isReviewed) {
//     res.status(400);
//     throw new Error('This booking has already been reviewed.');
//   }

//   // All checks passed, proceed to create the review
//   const review = await Review.create({
//     customer: customerId,
//     escort: booking.escort, // Get escort ID from the booking
//     booking: bookingId,
//     rating,
//     comment,
//   });

//   // Mark the booking as reviewed
//   booking.isReviewed = true;
//   await booking.save();

//   res.status(201).json({
//     message: 'Review submitted successfully!',
//     review,
//   });
// });

// // @desc    Get all reviews for a specific escort
// // @route   GET /api/reviews/escort/:id
// // @access  Public (or Private, depending on if you want only logged-in users to see reviews)
// const getEscortReviews = asyncHandler(async (req, res) => {
//   const { id } = req.params; // ID of the escort

//   // Optional: Check if the escort exists
//   const escort = await User.findById(id);
//   if (!escort || escort.role !== 'Escort') {
//     res.status(404);
//     throw new Error('Escort not found.');
//   }

//   const reviews = await Review.find({ escort: id })
//     .populate('customer', 'name') // Only populate customer's name for privacy
//     .sort({ createdAt: -1 }); // Most recent reviews first

//   res.status(200).json({
//     totalReviews: reviews.length,
//     reviews,
//   });
// });


// module.exports = {
//   submitReview,
//   getEscortReviews,
//   validate // Export the validate utility
// };

const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const User = require('../models/User'); // To update escort ratings
const Booking = require('../models/Booking'); // To check booking status and mark as reviewed

// Utility to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};


// @desc    Submit a review for a completed booking
// @route   POST /api/reviews
// @access  Private (Customer only)
const submitReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const customerId = req.user._id; // ID of the logged-in customer

  // 1. Check if the user is a Customer
  if (req.user.role !== 'Customer') {
    res.status(403);
    throw new Error('Only customers can submit reviews.');
  }

  // 2. Find the booking and ensure it exists
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }

  // 3. Validate that the logged-in customer is the one who made this booking
  if (booking.customer.toString() !== customerId.toString()) {
    res.status(403);
    throw new Error('Not authorized to review this booking. You did not make this booking.');
  }

  // 4. Ensure the booking status is 'Completed'
  if (booking.status !== 'Completed') {
    res.status(400);
    throw new Error(`Cannot review a booking with status "${booking.status}". Only "Completed" bookings can be reviewed.`);
  }

  // 5. Ensure the booking has not been reviewed already
  if (booking.isReviewed) {
    res.status(400);
    throw new Error('This booking has already been reviewed.');
  }

  // All checks passed, proceed to create the review
  const review = await Review.create({
    customer: customerId,
    escort: booking.escort, // Get escort ID from the booking
    booking: bookingId,
    rating,
    comment,
  });

  // Mark the booking as reviewed
  booking.isReviewed = true;
  await booking.save();

  res.status(201).json({
    message: 'Review submitted successfully!',
    review,
  });
});

// @desc    Get all reviews for a specific escort
// @route   GET /api/reviews/escort/:id
// @access  Public
const getEscortReviews = asyncHandler(async (req, res) => {
  const { id } = req.params; // ID of the escort

  // Optional: Check if the escort exists
  const escort = await User.findById(id);
  if (!escort || escort.role !== 'Escort') {
    res.status(404);
    throw new Error('Escort not found.');
  }

  const reviews = await Review.find({ escort: id })
    .populate('customer', 'name') // Only populate customer's name for privacy
    .sort({ createdAt: -1 }); // Most recent reviews first

  res.status(200).json({
    totalReviews: reviews.length,
    reviews,
  });
});


module.exports = {
  submitReview,
  getEscortReviews,
  validate
};