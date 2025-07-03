const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator'); // Make sure express-validator is installed
const AvailabilitySlot = require('../models/AvailableSlot');
const User = require('../models/User'); // To check user roles and broker assignments
const Booking = require('../models/Booking'); // To check against existing bookings

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


// Helper for authorization logic (reused from escortController)
const authorizeEscortAction = async (currentUser, targetEscortId) => {
    const escort = await User.findById(targetEscortId);

    if (!escort) {
        throw new Error('Escort not found.');
    }
    if (escort.role !== 'Escort') {
        throw new Error('Action can only be performed for a user with the role "Escort".');
    }

    if (currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()) {
        throw new Error('Not authorized to perform this action for another escort.');
    } else if (currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())) {
        throw new Error('Not authorized to perform this action for an escort not assigned to you.');
    } else if (currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker') {
        throw new Error('Not authorized to perform this action.');
    }
    return escort; // Return the escort document if authorized
};


// @desc    Add a new availability slot for an escort
// @route   POST /api/availability/:escortId/slots
// @access  Private (Escort, Broker, Admin)
const addAvailabilitySlot = asyncHandler(async (req, res) => {
  const { escortId } = req.params;
  const { startTime, endTime, notes } = req.body;
  const currentUser = req.user;

  // Authorize user to modify this escort's availability
  const escort = await authorizeEscortAction(currentUser, escortId);

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Basic date validation
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400);
    throw new Error('Invalid start or end time format. Please use ISO 8601 format (e.g., 2025-06-01T10:00:00Z).');
  }
  if (start >= end) {
    res.status(400);
    throw new Error('End time must be after start time.');
  }
  if (start < new Date()) {
    res.status(400);
    throw new Error('Availability slot start time must be in the future.');
  }

  // Check for overlaps with existing AVAILABILITY SLOTS for this escort
  const existingOverlappingSlots = await AvailabilitySlot.find({
    escort: escortId,
    $or: [
      { startTime: { $lt: end, $gte: start } },
      { endTime: { $gt: start, $lte: end } },
      { startTime: { $lte: start }, endTime: { $gte: end } },
      { startTime: { $gte: start }, endTime: { $lte: end } }
    ]
  });

  if (existingOverlappingSlots.length > 0) {
    res.status(409); // Conflict status code
    throw new Error('The declared availability slot overlaps with an existing availability slot.');
  }

  // Optional: Also check for overlaps with existing CONFIRMED bookings
  const overlappingBookings = await Booking.find({
    escort: escortId,
    status: 'Confirmed', // Only check confirmed bookings
    $or: [
      { startTime: { $lt: end, $gte: start } },
      { endTime: { $gt: start, $lte: end } },
      { startTime: { $lte: start }, endTime: { $gte: end } },
      { startTime: { $gte: start }, endTime: { $lte: end } }
    ]
  });

  if (overlappingBookings.length > 0) {
    res.status(409);
    throw new Error('The declared availability slot overlaps with an existing CONFIRMED booking. Please adjust.');
  }

  const newSlot = await AvailabilitySlot.create({
    escort: escortId,
    startTime: start,
    endTime: end,
    notes: notes,
  });

  res.status(201).json({
    message: 'Availability slot added successfully.',
    slot: newSlot,
  });
});


// @desc    Remove an availability slot
// @route   DELETE /api/availability/:escortId/slots/:slotId
// @access  Private (Escort, Broker, Admin)
const removeAvailabilitySlot = asyncHandler(async (req, res) => {
  const { escortId, slotId } = req.params;
  const currentUser = req.user;

  // Authorize user to modify this escort's availability
  const escort = await authorizeEscortAction(currentUser, escortId);

  const slot = await AvailabilitySlot.findOneAndDelete({
    _id: slotId,
    escort: escortId, // Ensure the slot belongs to this escort
  });

  if (!slot) {
    res.status(404);
    throw new Error('Availability slot not found or does not belong to this escort.');
  }

  // Optional: Prevent deletion if this slot is part of a future confirmed booking
  // This would require linking bookings to availability slots, which is a further refinement.
  // For now, it just deletes the slot. The booking itself still exists.

  res.status(200).json({
    message: 'Availability slot removed successfully.',
    slotId: slot._id,
  });
});


// @desc    Get all availability slots for a specific escort
// @route   GET /api/availability/:escortId/slots
// @access  Public
const getEscortAvailabilitySlots = asyncHandler(async (req, res) => {
  const { escortId } = req.params;
  const showPast = req.query.showPast === 'true'; // Optional query param to include past slots

  const query = {
    escort: escortId,
  };

  // Only show future slots by default unless showPast is true
  if (!showPast) {
    query.endTime = { $gte: new Date() }; // Only slots that end in the future
  }

  const slots = await AvailabilitySlot.find(query)
    .sort({ startTime: 1 }); // Sort by start time ascending

  if (!slots.length && !showPast) {
    // If no future slots, check if there are any at all
    const totalSlots = await AvailabilitySlot.countDocuments({ escort: escortId });
    if (totalSlots > 0) {
      res.status(200).json({
        message: 'No future availability slots found for this escort.',
        slots: [],
      });
    } else {
      res.status(200).json({
        message: 'No availability slots found for this escort.',
        slots: [],
      });
    }
  } else {
      res.status(200).json({
          totalSlots: slots.length,
          slots,
      });
  }
});


module.exports = {
  addAvailabilitySlot,
  removeAvailabilitySlot,
  getEscortAvailabilitySlots,
  validate, // Export the validate utility
};