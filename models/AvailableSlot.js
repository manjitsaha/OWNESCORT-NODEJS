const mongoose = require('mongoose');

const availabilitySlotSchema = mongoose.Schema(
  {
    escort: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the Escort User
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    // Optional: Add a flag if a slot is blocked for personal reasons vs. booked by a customer
    // isBlocked: {
    //   type: Boolean,
    //   default: false,
    // },
    // Optional: Reference to a Booking if this slot is part of a confirmed booking.
    // booking: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Booking',
    //   default: null,
    // },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add an index for faster queries by escort and time range
availabilitySlotSchema.index({ escort: 1, startTime: 1, endTime: 1 });

const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);

module.exports = AvailabilitySlot;