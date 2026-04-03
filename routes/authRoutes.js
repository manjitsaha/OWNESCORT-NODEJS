// // const express = require('express');
// // const { body } = require('express-validator'); // For input validation
// // const {
// //   registerUser,
// //   authUser,
// //   forgotPassword,
// //   resetPassword,
// //   updateFcmToken,
// //   validate // Import the validate utility
// // } = require('../controllers/authController');
// // const { protect } = require('../middlewares/authMiddleware');

// // const router = express.Router();

// // router.post(
// //   '/signup',
// //   [
// //     body('name').notEmpty().withMessage('Name is required'),
// //     body('email').isEmail().withMessage('Please include a valid email'),
// //     body('password')
// //       .isLength({ min: 6 })
// //       .withMessage('Password must be at least 6 characters long'),
// //     body('role').isIn(['Customer', 'Escort', 'Broker', 'Admin']).withMessage('Invalid role'),
// //   ],
// //   validate, // Run validation checks
// //   registerUser
// // );

// // router.post(
// //   '/login',
// //   [
// //     body('email').isEmail().withMessage('Please include a valid email'),
// //     body('password').notEmpty().withMessage('Password is required'),
// //   ],
// //   validate,
// //   authUser
// // );

// // router.post(
// //   '/forgot-password',
// //   [body('email').isEmail().withMessage('Please include a valid email')],
// //   validate,
// //   forgotPassword
// // );

// // router.put(
// //   '/reset-password/:resetToken',
// //   [
// //     body('password')
// //       .isLength({ min: 6 })
// //       .withMessage('Password must be at least 6 characters long'),
// //   ],
// //   validate,
// //   resetPassword
// // );

// // router.put(
// //   '/update-fcm-token',
// //   protect,
// //   [body('fcmToken').notEmpty().withMessage('FCM Token is required')],
// //   validate,
// //   updateFcmToken
// // );

// // module.exports = router;

// const express = require('express');
// const { body, param } = require('express-validator');
// const {
//   registerUser,
//   authUser,
//   requestOtpForLogin, // New
//   loginWithOtp,       // New
//   forgotPassword,
//   resetPassword,
//   updateFcmToken,
//   validate
// } = require('../controllers/authController');
// const { protect } = require('../middlewares/authMiddleware');

// const router = express.Router();

// // Existing Auth Routes
// router.post(
//   '/signup',
//   [
//     body('name').notEmpty().withMessage('Name is required'),
//     body('email').isEmail().withMessage('Please include a valid email'),
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters long'),
//     body('role').isIn(['Customer', 'Escort', 'Broker', 'Admin']).withMessage('Invalid role'),
//   ],
//   validate,
//   registerUser
// );

// router.post(
//   '/login',
//   [
//     body('email').isEmail().withMessage('Please include a valid email'),
//     body('password').notEmpty().withMessage('Password is required'),
//   ],
//   validate,
//   authUser
// );

// router.post(
//   '/forgot-password',
//   [body('email').isEmail().withMessage('Please include a valid email')],
//   validate,
//   forgotPassword
// );

// router.put(
//   '/reset-password/:resetToken',
//   [
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters long'),
//   ],
//   validate,
//   resetPassword
// );

// router.put(
//   '/update-fcm-token',
//   protect,
//   [body('fcmToken').notEmpty().withMessage('FCM Token is required')],
//   validate,
//   updateFcmToken
// );

// // NEW OTP-based Login Routes
// router.post(
//   '/otp/request',
//   [body('email').isEmail().withMessage('Please include a valid email')],
//   validate,
//   requestOtpForLogin
// );

// router.post(
//   '/otp/login',
//   [
//     body('email').isEmail().withMessage('Please include a valid email'),
//     body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit number').isNumeric().withMessage('OTP must be numeric'),
//   ],
//   validate,
//   loginWithOtp
// );

// module.exports = router;


const express = require('express');
const { body, param, check } = require('express-validator');
const {
  registerUser,
  authUser,
  requestOtpForSignup,
  requestOtpForLogin,
  loginWithOtp,
  forgotPassword,
  resetPassword,
  updateFcmToken,
  validate,
  checkExistingUser
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Check if user exists to decide on login or signup
router.post(
  '/check-user',
  checkExistingUser
);

// Request OTP for signup
router.post(
  '/signup/request-otp',
  [body('email').isEmail().withMessage('Please include a valid email.')],
  validate,
  requestOtpForSignup
);

// User registration
router.post(
  '/signup',
  [
    body('name').notEmpty().withMessage('Name is required.'),
    body('role').isIn(['Customer', 'Escort', 'Broker', 'Admin']).withMessage('Invalid role.'),
    body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit number.').isNumeric().withMessage('OTP must be numeric.'),
    body('idToken').optional().isString().withMessage('Firebase ID token must be a string.'),
  ],
  validate,
  registerUser
);

// Traditional email/password login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authUser
);

// Request OTP for login (email only for now)
router.post(
  '/otp/request',
  [body('email').isEmail().withMessage('Please include a valid email.')],
  validate,
  requestOtpForLogin
);

// Login with OTP
router.post(
  '/otp/login',
  [
    body('email').optional().isEmail().withMessage('Please include a valid email.'),
    body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit number.').isNumeric().withMessage('OTP must be numeric.'),
    body('idToken').optional().isString().withMessage('Firebase ID token must be a string.'),
  ],
  validate,
  loginWithOtp
);

// Forgot password request
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please include a valid email.')],
  validate,
  forgotPassword
);

// Reset password using token from email
router.put(
  '/reset-password/:resetToken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
  ],
  validate,
  resetPassword
);

// Update FCM token for push notifications
router.put(
  '/update-fcm-token',
  protect,
  [body('fcmToken').notEmpty().withMessage('FCM Token is required.')],
  validate,
  updateFcmToken
);

module.exports = router;