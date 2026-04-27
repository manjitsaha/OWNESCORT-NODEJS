const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    bio: {
      type: String,
    },
    dob: {
      type: String,
    },
    height: {
      type: String,
    },
    weight: {
      type: String,
    },
    breast: {
      type: String,
    },
    waist: {
      type: String,
    },
    hips: {
      type: String,
    },
    profession: {
      type: String,
    },
    religion: {
      type: String,
    },
    personality: {
      type: String,
    },

    role: {
      type: String,
      required: true,
      enum: ['Customer', 'Escort', 'Broker', 'Admin'],
      default: 'Customer',
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      sparse: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    specialServices: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (v) => Math.round(v * 10) / 10
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        index: '2dsphere',
      },
    },
    favourites: {
      type: [String],
      default: [],
    },
    // NEW FIELDS FOR MEDIA GALLERY
    profileImages: {
      type: [String],
      default: [],
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    profileVideos: {
      type: [String],
      default: [],
    },
    desires: {
      type: String,
      default: "",
    },
    internalReview: {
      type: Number,
      default: 0,
    },
    viewedCount: {
      type: Number,
      default: 0,
    },
    likedCount: {
      type: Number,
      default: 0,
    },
    lateNightStatus: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // Compare password method
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // Generate and hash password reset token
// userSchema.methods.getResetPasswordToken = function () {
//   const resetToken = crypto.randomBytes(20).toString('hex');

//   this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//   this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

//   return resetToken;
// };

const User = mongoose.model('User', userSchema);

module.exports = User;