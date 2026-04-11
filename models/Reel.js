const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Reel = mongoose.model('Reel', reelSchema);

module.exports = Reel;
