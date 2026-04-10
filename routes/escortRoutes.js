const express = require('express');
const upload = require('../middlewares/upload.js');
const User = require('../models/User.js')
const { body, param, query } = require('express-validator');
const {
  getAvailableEscorts,
  toggleAvailability,
  updateEscortRates,
  updateEscortSpecialServices,
  updateEscortLocation,
  addEscortMedia, // Import new function
  removeEscortMedia, // Import new function
  validate,
  uploadEscortGallery,
  getProfile,
  favouriteUnfavouriteEscort,
  updateProfile,
  getFavouriteEscorts,
  deleteEscortImage,
  uploadEscortProfilePhoto,
  incrementViewedCount,
  incrementLikedCount
} = require('../controllers/escortController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get available escorts (supports filtering by name, special service, and geospatial location)
router.get(
  '/available',
  protect,
  authorizeRoles(['Customer']),
  [
    // query('specialService')
    //   .optional()
    //   .isIn(['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'])
    //   .withMessage('Invalid special service filter provided.'),
    query('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a number between -90 and 90.'),
    query('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a number between -180 and 180.'),
    query('maxDistance').optional().isInt({ min: 0 }).withMessage('Max distance must be a non-negative integer (in meters).'),
    query('latitude').if(query('longitude').exists()).notEmpty().withMessage('Latitude is required if Longitude is provided.'),
    query('longitude').if(query('latitude').exists()).notEmpty().withMessage('Longitude is required if Latitude is provided.'),
    query('sortBy') // For 'recently_added' and 'highest_rated'
      .optional()
      .isIn(['recently_added', 'highest_rated'])
      .withMessage('Invalid sortBy parameter. Allowed values are: recently_added, highest_rated.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer.'),
    query('name').optional().isString().trim().escape().withMessage('Name must be a string.'),
  ],
  validate,
  getAvailableEscorts
);

router.get(
  '/favouriteList',
  protect,
  authorizeRoles(['Customer']),

  validate,
  getFavouriteEscorts
);

// Escort can toggle their own availability
router.put('/availability', protect, authorizeRoles(['Escort']), toggleAvailability);

router.get('/profile', protect, authorizeRoles(['Escort']), getProfile);

// Update escort rates
router.put(
  '/:id/rates',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
    body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a non-negative number.'),
    body('dailyRate').optional().isFloat({ min: 0 }).withMessage('Daily rate must be a non-negative number.'),
    body('brokerId').optional().isMongoId().withMessage('Invalid Broker ID format.'),
  ],
  validate,
  updateEscortRates
);

// Update escort's special services (party features)
router.put(
  '/:id/special-services',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
    body('specialServices').isArray().withMessage('Special services must be an array.'),
    body('specialServices.*.name')
      .isIn(['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'])
      .withMessage('Invalid special service name provided.'),
    body('specialServices.*.price')
      .isFloat({ min: 0 }).withMessage('Special service price must be a non-negative number.'),
  ],
  validate,
  updateEscortSpecialServices
);

// Update escort's location
router.put(
  '/:id/location',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a number between -90 and 90.'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a number between -180 and 180.'),
  ],
  validate,
  updateEscortLocation
);

router.put(
  '/favourite',
  protect,
  authorizeRoles(['Customer']),
  validate,
  favouriteUnfavouriteEscort
);

router.put(
  '/updateProfile',
  protect,
  authorizeRoles(['Customer', 'Escort', 'Broker', 'Admin']),
  validate,
  updateProfile
);

router.post(
  '/upload-images',
  protect,
  authorizeRoles(['Escort', 'Customer']),
  upload.array('images', 10),
  [
    body('images').custom((value, { req }) => {
      if (!req.files || req.files.length === 0) {
        throw new Error('At least one image must be uploaded');
      }
      return true;
    })
  ],
  validate,
  uploadEscortGallery
);

router.post(
  '/upload-profile-photo',
  protect,
  authorizeRoles(['Escort']),
  upload.single('profilePhoto'),
  [
    body('profilePhoto').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('At least one image must be uploaded');
      }
      return true;
    })
  ],
  validate,
  uploadEscortProfilePhoto
);

router.delete(
  '/deleteImage',
  protect,
  authorizeRoles(['Escort']),
  validate,
  deleteEscortImage
);
// NEW ROUTE: Add media to escort profile
router.post(
  '/:id/media',
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
    body('mediaType').isIn(['image', 'video']).withMessage('Media type must be "image" or "video".'),
    body('url').isURL().withMessage('Invalid URL provided.').trim(), // Trim added for good measure
  ],
  validate,
  addEscortMedia
);

// NEW ROUTE: Remove media from escort profile
router.delete(
  '/:id/media', // Use DELETE method with body for specific URL
  protect,
  authorizeRoles(['Escort', 'Broker', 'Admin']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
    body('mediaType').isIn(['image', 'video']).withMessage('Media type must be "image" or "video".'),
    body('url').isURL().withMessage('Invalid URL provided.').trim(),
  ],
  validate,
  removeEscortMedia
);

// NEW ROUTE: Increment viewed count
router.put(
  '/:id/view',
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
  ],
  validate,
  incrementViewedCount
);

// NEW ROUTE: Increment liked count
router.put(
  '/:id/like',
  protect,
  authorizeRoles(['Customer']),
  [
    param('id').isMongoId().withMessage('Invalid Escort ID.'),
  ],
  validate,
  incrementLikedCount
);

module.exports = router;