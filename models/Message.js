const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // The user who sent the message
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Optional if messages are part of a group chat or specific booking chat
      ref: 'User', // The user who received the message (for 1-1 chat)
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // Messages will be associated with a specific booking for context
      ref: 'Booking', // Reference to the booking this message relates to
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [ // Array of user IDs who have read this message
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Add indexes for efficient querying
messageSchema.index({ booking: 1, createdAt: 1 }); // For getting messages in a booking chat
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 }); // For direct messages (if applicable)

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;