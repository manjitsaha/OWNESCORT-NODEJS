const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Message = require('../models/Message'); // Import the Message model
const Booking = require('../models/Booking'); // To validate booking participation

// Utility to handle validation errors (ensure this is present or shared)
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


// @desc    Get historical messages for a specific booking chat
// @route   GET /api/messages/booking/:bookingId
// @access  Private (Customer, Escort, Broker, Admin involved in/authorized for booking)
const getBookingMessages = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const currentUser = req.user; // User from protect middleware
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50; // Default to 50 messages per page
  const skip = (page - 1) * limit;

  // 1. Validate bookingId
  if (!bookingId) {
    res.status(400);
    throw new Error('Booking ID is required.');
  }

  // 2. Find the booking and authorize the user
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }

  const isCustomer = booking.customer.toString() === currentUser._id.toString();
  const isEscort = booking.escort.toString() === currentUser._id.toString();
  const isBrokerOrAdmin = currentUser.role === 'Broker' || currentUser.role === 'Admin'; // Further refine for specific broker/admin permissions if needed

  if (!isCustomer && !isEscort && !isBrokerOrAdmin) {
    res.status(403);
    throw new Error('Not authorized to view messages for this booking.');
  }

  // 3. Fetch messages for the booking, with pagination and sender/receiver details
  const messages = await Message.find({ booking: bookingId })
    .populate('sender', 'name role') // Populate sender's name and role
    // .populate('receiver', 'name role') // Only if direct 1-1 chat messages have a distinct receiver field, otherwise messages are room-based
    .sort({ createdAt: 1 }) // Oldest messages first
    .skip(skip)
    .limit(limit);

  const totalMessages = await Message.countDocuments({ booking: bookingId });

  res.status(200).json({
    page,
    limit,
    totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
    messages,
  });
});

module.exports = {
  getBookingMessages,
  validate, // Export the validate utility
};