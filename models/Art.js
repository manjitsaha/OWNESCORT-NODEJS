const mongoose = require('mongoose');

const artSchema = new mongoose.Schema(
  {
    escortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    art: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Art = mongoose.model('Art', artSchema);

module.exports = Art;
