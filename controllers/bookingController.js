const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendPushNotification, createInAppNotification } = require('./notificationController');

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

// Helper function to generate a numeric OTP (not directly used in booking, but kept for context)
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};


// @desc    Customer books an escort
// @route   POST /api/bookings
// @access  Private (Customer)
const createBooking = asyncHandler(async (req, res) => {
  const { escortId, startTime, serviceHours, notes } = req.body;
  const customerId = req.user._id; // Logged-in customer

  const customer = await User.findById(customerId);
  const escort = await User.findById(escortId);

  if (!customer || customer.role !== 'Customer') {
    res.status(403);
    throw new Error('Only customers can create bookings.');
  }

  if (!escort || escort.role !== 'Escort') {
    res.status(404);
    throw new Error('Escort not found or invalid user role.');
  }

  const start = new Date(startTime);

  // Basic validation
  if (isNaN(start.getTime())) {
    res.status(400);
    throw new Error('Invalid start time format. Please use ISO 8601 format (e.g., 2025-06-01T10:00:00Z).');
  }

  if (!serviceHours || isNaN(serviceHours) || serviceHours <= 0) {
    res.status(400);
    throw new Error('Please provide valid valid serviceHours greater than 0.');
  }

  const end = new Date(start.getTime() + serviceHours * 60 * 60 * 1000);

  if (start < new Date()) {
    res.status(400);
    throw new Error('Booking start time must be in the future.');
  }

  // --- AVAILABILITY CHECK ---
  // Check for any CONFIRMED or PENDING bookings that overlap with the requested time
  const overlappingBookings = await Booking.find({
    escort: escortId,
    status: { $in: ['Confirmed', 'Pending'] }, // Check confirmed AND pending to avoid new overlaps
    $or: [
      // Case 1: Existing booking starts within the new booking's period
      { startTime: { $lt: end, $gte: start } },
      // Case 2: Existing booking ends within the new booking's period
      { endTime: { $gt: start, $lte: end } },
      // Case 3: Existing booking fully contains the new booking's period
      { startTime: { $lte: start }, endTime: { $gte: end } },
      // Case 4: New booking fully contains an existing booking's period
      { startTime: { $gte: start }, endTime: { $lte: end } }
    ]
  });

  if (overlappingBookings.length > 0) {
    res.status(409); // Conflict status code
    throw new Error('Escort is not available during the requested time slot. There is an overlapping booking.');
  }
  // --- END AVAILABILITY CHECK ---

  // Calculate duration and price
  const durationInMs = end.getTime() - start.getTime();
  const durationInHours = durationInMs / (1000 * 60 * 60);

  let totalPrice = 0;
  let rateTypeUsed = 'hourly';
  let bookedHourlyRate = escort.hourlyRate;
  let bookedDailyRate = escort.dailyRate;

  // Simple pricing logic: if duration is 8 hours or more, use daily rate if available and greater than 0
  if (durationInHours >= 8 && escort.dailyRate > 0) {
    totalPrice = escort.dailyRate;
    rateTypeUsed = 'daily';
  } else {
    totalPrice = escort.hourlyRate * durationInHours;
    rateTypeUsed = 'hourly';
  }

  if (totalPrice <= 0) {
    res.status(400);
    throw new Error('Escort has invalid rates or booking duration results in zero price. Please check escort rates and booking duration.');
  }

  const booking = await Booking.create({
    customer: customerId,
    escort: escortId,
    startTime: start,
    endTime: end,
    totalPrice: totalPrice,
    notes,
    rateTypeUsed,
    bookedHourlyRate,
    bookedDailyRate,
  });

  if (booking) {
    // Send push notification to the escort
    if (escort.fcmToken) {
      await sendPushNotification(
        escort.fcmToken,
        'New Booking Request!',
        `You have a new booking request from ${customer.name} for ${durationInHours.toFixed(2)} hours, starting ${start.toLocaleString()}.`,
        { bookingId: booking._id.toString(), type: 'new_booking' }
      );
    }
    // Create in-app notification for the escort
    await createInAppNotification(
      escort._id,
      'New Booking Request!',
      `You have a new booking request from ${customer.name} for ${durationInHours.toFixed(2)} hours, starting ${start.toLocaleString()}.`,
      'booking_request',
      { bookingId: booking._id.toString() }
    );

    res.status(201).json({
      message: 'Booking created successfully and is pending confirmation.',
      booking,
    });
  } else {
    res.status(400);
    throw new Error('Invalid booking data.');
  }
});

// @desc    Get bookings for the logged-in user (Customer, Escort, Broker, Admin) with pagination
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = {};
  if (req.user.role === 'Customer') {
    query = { customer: req.user._id };
  } else if (req.user.role === 'Escort') {
    query = { escort: req.user._id };
  } else if (req.user.role === 'Broker' || req.user.role === 'Admin') {
    // Broker/Admin can see all bookings or bookings related to their managed escorts
    query = {}; // For now, they see all. Refine this based on your business logic.
  } else {
    res.status(403);
    throw new Error('Unauthorized role to view bookings.');
  }

  // Optional: Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate('customer', 'name email')
    .populate('escort', 'name email hourlyRate dailyRate') // Populate escort rates too
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.status(200).json({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    data: bookings,
  });
});

// @desc    Update booking status (e.g., Confirm, Cancel)
// @route   PUT /api/bookings/:id/status
// @access  Private (Escort, Broker, Admin)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found.');
  }

  if (req.user.role !== 'Escort' && req.user.role !== 'Broker' && req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Unauthorized to update booking status.');
  }

  // If escort is updating, ensure it's their booking
  if (req.user.role === 'Escort' && booking.escort.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only update your own bookings.');
  }

  const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status provided.');
  }

  // Prevent changing status of already completed/cancelled bookings (optional, but good)
  if (booking.status === 'Completed' || booking.status === 'Cancelled') {
    res.status(400);
    throw new Error(`Cannot change status of a booking that is already ${booking.status}.`);
  }

  booking.status = status;
  await booking.save();

  // Send push notification to the customer about status update
  const customer = await User.findById(booking.customer);
  const escort = await User.findById(booking.escort); // Get escort details for notification
  if (customer && customer.fcmToken) {
    await sendPushNotification(
      customer.fcmToken,
      'Booking Update!',
      `Your booking with ${escort.name} has been ${status.toLowerCase()}.`,
      { bookingId: booking._id.toString(), type: 'booking_status_update' }
    );
  }
  // Create in-app notification for the customer
  await createInAppNotification(
    customer._id,
    'Booking Update!',
    `Your booking with ${escort.name} has been ${status.toLowerCase()}.`,
    'booking_status_update',
    { bookingId: booking._id.toString() }
  );

  res.status(200).json(booking);
});

// @desc    Get available booking slots of a specific escort
// @route   POST /api/bookings/available-slots
// @access  Public / Private
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { escortId, date, serviceHours } = req.body;

  if (!escortId || !date || !serviceHours) {
    res.status(400);
    throw new Error('Please provide escortId, date, and serviceHours.');
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    res.status(400);
    throw new Error('Invalid date format. Please use YYYY-MM-DD or ISO 8601.');
  }

  if (isNaN(serviceHours) || serviceHours <= 0) {
    res.status(400);
    throw new Error('serviceHours must be a valid number greater than 0.');
  }

  // Define the start and end of the specified date
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Fetch all Confirmed and Pending bookings that overlap with this day
  const existingBookings = await Booking.find({
    escort: escortId,
    status: { $in: ['Confirmed', 'Pending'] },
    $or: [
      { startTime: { $lte: endOfDay }, endTime: { $gte: startOfDay } }
    ]
  });

  const availableSlots = [];
  const intervalMs = 30 * 60 * 1000; // 30-minute interval slots dynamically generated
  const serviceMs = serviceHours * 60 * 60 * 1000;
  const now = new Date();

  let currentSlotStart = new Date(startOfDay);

  while (currentSlotStart < endOfDay) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + serviceMs);

    // Ensure we don't suggest past slots
    if (currentSlotStart > now) {
      let isOverlapping = false;

      // Check overlap logically for each booking
      for (const booking of existingBookings) {
        // If slot start is before booking ends AND slot end is after booking starts
        if (currentSlotStart < booking.endTime && currentSlotEnd > booking.startTime) {
          isOverlapping = true;
          break;
        }
      }

      if (!isOverlapping) {
        availableSlots.push({
          startTime: new Date(currentSlotStart),
          endTime: new Date(currentSlotEnd)
        });
      }
    }

    currentSlotStart = new Date(currentSlotStart.getTime() + intervalMs);
  }

  res.status(200).json({
    date: startOfDay.toISOString().split('T')[0],
    escortId,
    serviceHours,
    availableSlots
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getAvailableSlots,
  validate
};