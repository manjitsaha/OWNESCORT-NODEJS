const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
// const sendSms = require('../utils/sendSms'); // Uncomment if mobile OTP is re-enabled
const crypto = require('crypto');

// Utility to handle validation errors
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

// Helper function to generate a numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};


// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body; // phoneNumber removed for now

  const userExists = await User.findOne({ email }); // Check by email only for now

  if (userExists) {
    res.status(400).json({ message: 'User already exists with this email.' });
    throw new Error('User already exists with this email.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Customer',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(403).json({ message: 'Invalid user data provided.' });
    throw new Error('Invalid user data provided.');
  }
});

// @desc    Auth user & get token (traditional password login)
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (fcmToken && user.fcmToken !== fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password.');
  }
});

// @desc    Request OTP for login (currently email only)
// @route   POST /api/auth/otp/request
// @access  Public
const requestOtpForLogin = asyncHandler(async (req, res) => {
  const { email } = req.body; // phoneNumber is not handled here currently

  let user;
  if (email) {
    user = await User.findOne({ email });
  } else {
    res.status(400);
    throw new Error('Email is required to request OTP.');
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found with this email address.');
  }

  // Generate OTP
  const otpCode = generateNumericOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

  // Invalidate any existing active OTPs for this user and type
  await Otp.updateMany(
    { userId: user._id, type: 'login', isUsed: false, expiresAt: { $gt: Date.now() } },
    { $set: { isUsed: true } } // Mark as used/invalid
  );

  // Save new OTP to database (OTP will be hashed by pre-save hook in Otp model)
  const otpEntry = await Otp.create({
    userId: user._id,
    otp: otpCode,
    expiresAt: expiresAt,
    type: 'login',
  });

  const message = `Your One-Time Password (OTP) for login is: <b>${otpCode}</b>. This OTP is valid for 5 minutes.`;

  try {
    // Only email sending is active for OTP requests
    if (!user.email) {
      res.status(400);
      throw new Error('User does not have an email address registered for OTP delivery.');
    }
    await sendEmail({
      email: user.email,
      subject: 'Your Login OTP',
      message: `<b>${message}</b>`,
    });
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    // If sending fails, invalidate the generated OTP
    await Otp.findByIdAndDelete(otpEntry._id);
    console.error(`Error sending OTP: ${error.message}`);
    res.status(500);
    throw new Error('Failed to send OTP. Please try again.');
  }
});

// @desc    Login with OTP (currently email only)
// @route   POST /api/auth/otp/login
// @access  Public
const loginWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, fcmToken } = req.body; // phoneNumber not handled here

  let user;
  if (email) {
    user = await User.findOne({ email });
  } else {
    res.status(400);
    throw new Error('Email is required for OTP login.');
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found with this email address.');
  }

  // Find the most recent active OTP for this user and type
  const otpEntry = await Otp.findOne({
    userId: user._id,
    type: 'login',
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  }).sort({ createdAt: -1 });

  if (!otpEntry || !(await otpEntry.matchOtp(otp))) {
    res.status(401);
    throw new Error('Invalid or expired OTP.');
  }

  // Mark OTP as used
  otpEntry.isUsed = true;
  await otpEntry.save();

  // If FCM Token is provided and different, update it
  if (fcmToken && user.fcmToken !== fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
    message: 'Login successful via OTP.'
  });
});

// @desc    Forgot password (using User model's resetPasswordToken)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User with that email does not exist.');
  }

  // Generate and hash password reset token using User model method
  const resetToken = user.getResetPasswordToken(); // Raw token (e.g., hex string)
  await user.save({ validateBeforeSave: false }); // Save user with hashed token and expiry

  // The URL sent to the user contains the raw token
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please click on this link to reset your password:</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
    <p>This link is valid for 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent for password reset.' });
  } catch (error) {
    // Clear token if email sending fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(error);
    res.status(500);
    throw new Error('Email could not be sent.');
  }
});

// @desc    Reset Password (using User model's resetPasswordToken)
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  // Hash the incoming token from URL parameter to match the stored hashed token
  const hashedResetToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedResetToken,
    resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token.');
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully.' });
});


// @desc    Update FCM Token for a user
// @route   PUT /api/auth/update-fcm-token
// @access  Private
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    res.status(400);
    throw new Error('FCM Token is required.');
  }

  req.user.fcmToken = fcmToken;
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'FCM Token updated successfully.',
  });
});

module.exports = {
  registerUser,
  authUser,
  requestOtpForLogin,
  loginWithOtp,
  forgotPassword,
  resetPassword,
  updateFcmToken,
  validate
};