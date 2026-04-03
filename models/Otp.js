// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const otpSchema = mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: 'User', // Reference to the User model
//     },
//     otp: {
//       type: String,
//       required: true,
//     },
//     expiresAt: {
//       type: Date,
//       required: true,
//     },
//     type: {
//       type: String,
//       enum: ['login', 'password_reset', 'email_verification'], // Define types of OTP
//       required: true,
//     },
//     isUsed: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Hash the OTP before saving
// otpSchema.pre('save', async function (next) {
//   if (this.isModified('otp')) {
//     const salt = await bcrypt.genSalt(10);
//     this.otp = await bcrypt.hash(this.otp, salt);
//   }
//   next();
// });

// // Method to compare entered OTP with hashed OTP
// otpSchema.methods.matchOtp = async function (enteredOtp) {
//   return await bcrypt.compare(enteredOtp, this.otp);
// };

// // Index for faster lookups and automatic deletion of expired OTPs (optional, but good)
// otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// const Otp = mongoose.model('Otp', otpSchema);

// module.exports = Otp;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Made optional for signup OTP
      ref: 'User', // Reference to the User model
    },
    email: {
      type: String,
      required: false, // Stored for signup OTPs
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['login', 'password_reset', 'email_verification', 'signup'], // Added 'signup'
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the OTP before saving
otpSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

// Method to compare entered OTP with hashed OTP
otpSchema.methods.matchOtp = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp, this.otp);
};

// Index for faster lookups and automatic deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;