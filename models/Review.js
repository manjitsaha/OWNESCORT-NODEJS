// // models/Review.js
// const mongoose = require('mongoose');

// const reviewSchema = mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User', // The customer who submitted the review
//     },
//     escort: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User', // The escort being reviewed
//     },
//     booking: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'Booking', // The specific booking this review is for
//       unique: true, // A booking can only be reviewed once
//     },
//     rating: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 5,
//       message: 'Rating must be between 1 and 5',
//     },
//     comment: {
//       type: String,
//       trim: true,
//     },
//   },
//   {
//     timestamps: true, // Adds createdAt and updatedAt fields
//   }
// );

// // Optional: Add index for faster queries on escort reviews
// reviewSchema.index({ escort: 1, createdAt: -1 });

// // Static method to calculate the average rating for an escort and save it to the User model
// reviewSchema.statics.getAverageRating = async function (escortId) {
//   const stats = await this.aggregate([
//     {
//       $match: { escort: escortId },
//     },
//     {
//       $group: {
//         _id: '$escort',
//         averageRating: { $avg: '$rating' },
//         numReviews: { $sum: 1 },
//       },
//     },
//   ]);

//   try {
//     await mongoose.model('User').findByIdAndUpdate(escortId, {
//       averageRating: stats.length > 0 ? stats[0].averageRating : 0,
//       numReviews: stats.length > 0 ? stats[0].numReviews : 0,
//     });
//   } catch (err) {
//     console.error(`Error updating average rating for escort ${escortId}:`, err);
//   }
// };

// // Call getAverageRating after save
// reviewSchema.post('save', function () {
//   this.constructor.getAverageRating(this.escort);
// });

// // Call getAverageRating after remove
// reviewSchema.post('remove', function () {
//   this.constructor.getAverageRating(this.escort);
// });

// const Review = mongoose.model('Review', reviewSchema);

// module.exports = Review;

const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // The customer who submitted the review
    },
    escort: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // The escort being reviewed
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Booking', // The specific booking this review is for
      unique: true, // A booking can only be reviewed once
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      message: 'Rating must be between 1 and 5',
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Optional: Add index for faster queries on escort reviews
reviewSchema.index({ escort: 1, createdAt: -1 });

// Static method to calculate the average rating for an escort and save it to the User model
reviewSchema.statics.getAverageRating = async function (escortId) {
  const stats = await this.aggregate([
    {
      $match: { escort: escortId },
    },
    {
      $group: {
        _id: '$escort',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    await mongoose.model('User').findByIdAndUpdate(escortId, {
      averageRating: stats.length > 0 ? stats[0].averageRating : 0,
      numReviews: stats.length > 0 ? stats[0].numReviews : 0,
    });
  } catch (err) {
    console.error(`Error updating average rating for escort ${escortId}:`, err);
  }
};

// Call getAverageRating after review save
// 'this' refers to the review document being saved
reviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.escort);
});

// Call getAverageRating after review removal
// 'this' refers to the review document being removed
reviewSchema.post('remove', function () {
  this.constructor.getAverageRating(this.escort);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;