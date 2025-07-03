// const mongoose = require('mongoose');

// const bookingSchema = mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User', // References the User model
//     },
//     escort: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User', // References the User model (where role is 'Escort')
//     },
//     bookingDate: {
//       type: Date,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
//       default: 'Pending',
//     },
//     notes: {
//       type: String,
//     },
//     // Add other relevant booking details like duration, service type, etc.
//   },
//   {
//     timestamps: true,
//   }
// );

// const Booking = mongoose.model('Booking', bookingSchema);

// module.exports = Booking;

const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    escort: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
    notes: {
      type: String,
    },
    rateTypeUsed: {
      type: String,
      enum: ['hourly', 'daily'],
    },
    bookedHourlyRate: { // Rate at the time of booking
      type: Number,
    },
    bookedDailyRate: { // Rate at the time of booking
      type: Number,
    },
    isReviewed: { // Flag to indicate if this booking has been reviewed by the customer
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;