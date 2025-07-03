// const mongoose = require('mongoose');

// const notificationSchema = mongoose.Schema(
//   {
//     recipient: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User',
//     },
//     title: {
//       type: String,
//       required: true,
//     },
//     body: {
//       type: String,
//       required: true,
//     },
//     read: {
//       type: Boolean,
//       default: false,
//     },
//     type: { // e.g., 'booking_update', 'new_message', 'availability_change'
//       type: String,
//     },
//     data: { // Optional: store additional data related to the notification
//       type: Object,
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// const Notification = mongoose.model('Notification', notificationSchema);

// module.exports = Notification;

const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: { // e.g., 'booking_update', 'new_message', 'availability_change', 'new_review'
      type: String,
    },
    data: { // Optional: store additional data related to the notification
      type: Object,
    }
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;