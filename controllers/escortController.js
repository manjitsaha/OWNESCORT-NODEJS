// const asyncHandler = require('express-async-handler');
// const { validationResult } = require('express-validator');
// const User = require('../models/User');

// // Utility to handle validation errors (ensure this is present or shared)
// const validate = (req, res, next) => {
//   const errors = validationResult(req);
//   if (errors.isEmpty()) {
//     return next();
//   }
//   const extractedErrors = [];
//   errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

//   return res.status(422).json({
//     errors: extractedErrors,
//   });
// };

// // @desc    Get all available escorts
// // @route   GET /api/escorts/available
// // @access  Public
// const getAvailableEscorts = asyncHandler(async (req, res) => {
//   const pageSize = parseInt(req.query.limit) || 10;
//   const page = parseInt(req.query.page) || 1;
//   const name = req.query.name;
//   const specialService = req.query.specialService; // Still present for party features
//   const sortBy = req.query.sortBy; // Re-added for 'most_rated' and 'recently_added'
//   const latitude = parseFloat(req.query.latitude); // For geospatial
//   const longitude = parseFloat(req.query.longitude); // For geospatial
//   const maxDistance = parseFloat(req.query.maxDistance) || 10000; // Default 10km

//   const query = {
//     role: 'Escort',
//     // isAvailable: true, // Re-add this if you decide to filter by availability by default
//   };

//   if (name) {
//     query.name = { $regex: name, $options: 'i' };
//   }

//   if (specialService) {
//     const allowedServices = ['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'];
//     if (!allowedServices.includes(specialService)) {
//       res.status(400);
//       throw new Error(`Invalid special service filter: ${specialService}. Allowed values are: ${allowedServices.join(', ')}`);
//     }
//     query['specialServices.name'] = specialService;
//   }

//   // Geospatial query if latitude and longitude are provided
//   if (!isNaN(latitude) && !isNaN(longitude)) {
//     // Ensure the escort has a location defined
//     query['location.coordinates'] = { $exists: true };

//     query.location = {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
//         },
//         $maxDistance: maxDistance, // Distance in meters
//       },
//     };
//   }

//   // Sorting logic based on sortBy parameter
//   let sortOptions = { createdAt: -1 }; // Default to recently added

//   if (sortBy === 'recently_added') {
//     sortOptions = { createdAt: -1 };
//   } else if (sortBy === 'highest_rated') {
//     sortOptions = { averageRating: -1 };
//     query.numReviews = { $gt: 0 }; // Only show highly rated if they have reviews
//   }
//   // Add other sorting options like 'nearby' once location is set, but that's handled by $near already.

//   const count = await User.countDocuments(query);
//   const escorts = await User.find(query)
//     .limit(pageSize)
//     .skip(pageSize * (page - 1))
//     .sort(sortOptions) // Apply sorting
//     .select('-password -fcmToken -resetPasswordToken -resetPasswordExpire'); // Exclude sensitive fields

//   res.json({
//     escorts,
//     page,
//     pages: Math.ceil(count / pageSize),
//     total: count,
//   });
// });

// // @desc    Toggle availability for logged-in escort
// // @route   PUT /api/escorts/availability
// // @access  Private (Escort)
// const toggleAvailability = asyncHandler(async (req, res) => {
//   const user = req.user; // User from protect middleware

//   if (user.role !== 'Escort') {
//     res.status(403);
//     throw new Error('Not authorized to toggle availability. Only escorts can use this route for themselves.');
//   }

//   // Assuming 'isAvailable' field is correctly implemented in User model
//   user.isAvailable = !user.isAvailable;
//   await user.save();
//   res.json({
//       message: `Escort availability toggled to ${user.isAvailable ? 'available' : 'unavailable'}`,
//       isAvailable: user.isAvailable
//   });
// });


// // @desc    Update escort rates by escort, broker, or admin
// // @route   PUT /api/escorts/:id/rates
// // @access  Private (Escort, Broker, Admin)
// const updateEscortRates = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { hourlyRate, dailyRate, brokerId } = req.body;

//   const escort = await User.findById(id);

//   if (!escort) {
//     res.status(404);
//     throw new Error('Escort not found.');
//   }

//   if (escort.role !== 'Escort') {
//     res.status(400);
//     throw new Error('Only users with the role "Escort" can have rates updated.');
//   }

//   const currentUser = req.user;

//   // Authorization Check (similar to updateEscortRates)
//   if (
//     currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update rates for another escort.');
//   } else if (
//     currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update rates for an escort not assigned to you.');
//   } else if (
//     currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to perform this action.');
//   }

//   if (hourlyRate !== undefined) {
//     escort.hourlyRate = hourlyRate;
//   }
//   if (dailyRate !== undefined) {
//     escort.dailyRate = dailyRate;
//   }

//   if (brokerId !== undefined) {
//       if (currentUser.role === 'Admin' || currentUser.role === 'Broker') {
//           const newBroker = await User.findById(brokerId);
//           if (!newBroker || newBroker.role !== 'Broker') {
//               res.status(400);
//               throw new Error('Invalid broker ID or user is not a Broker.');
//           }
//           escort.broker = newBroker._id; // Assign the broker's ID
//       } else {
//           res.status(403);
//           throw new Error('Only Admin or Broker can assign/reassign an escort\'s broker.');
//       }
//   }

//   await escort.save();

//   res.json({
//     message: 'Escort rates and/or broker updated successfully',
//     escort: {
//       _id: escort._id,
//       name: escort.name,
//       email: escort.email,
//       role: escort.role,
//       hourlyRate: escort.hourlyRate,
//       dailyRate: escort.dailyRate,
//       broker: escort.broker,
//     },
//   });
// });

// // @desc    Update escort's special services by escort, broker, or admin
// // @route   PUT /api/escorts/:id/special-services
// // @access  Private (Escort, Broker, Admin)
// const updateEscortSpecialServices = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { specialServices } = req.body; // Expects an array of { name, price }

//   const escort = await User.findById(id);

//   if (!escort) {
//     res.status(404);
//     throw new Error('Escort not found.');
//   }

//   if (escort.role !== 'Escort') {
//     res.status(400);
//     throw new Error('Special services can only be updated for users with the role "Escort".');
//   }

//   const currentUser = req.user;

//   // Authorization Check (similar to updateEscortRates)
//   if (
//     currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update special services for another escort.');
//   } else if (
//     currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update special services for an escort not assigned to you.');
//   } else if (
//     currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to perform this action.');
//   }

//   // Validate incoming specialServices array
//   if (!Array.isArray(specialServices)) {
//     res.status(400);
//     throw new Error('specialServices must be an array.');
//   }

//   const allowedServices = ['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'];
//   const newServices = [];

//   for (const service of specialServices) {
//     if (!service.name || !allowedServices.includes(service.name)) {
//       res.status(400);
//       throw new Error(`Invalid or missing service name: ${service.name}. Allowed values are: ${allowedServices.join(', ')}`);
//     }
//     if (typeof service.price !== 'number' || service.price < 0) {
//       res.status(400);
//       throw new Error(`Invalid or missing price for service ${service.name}. Price must be a non-negative number.`);
//     }
//     newServices.push({ name: service.name, price: service.price });
//   }

//   escort.specialServices = newServices; // Replace existing services
//   await escort.save();

//   res.json({
//     message: 'Escort special services updated successfully',
//     escort: {
//       _id: escort._id,
//       name: escort.name,
//       role: escort.role,
//       specialServices: escort.specialServices,
//     },
//   });
// });

// // @desc    Update escort's location by escort, broker, or admin
// // @route   PUT /api/escorts/:id/location
// // @access  Private (Escort, Broker, Admin)
// const updateEscortLocation = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { latitude, longitude } = req.body;

//   const escort = await User.findById(id);

//   if (!escort) {
//     res.status(404);
//     throw new Error('Escort not found.');
//   }

//   if (escort.role !== 'Escort') {
//     res.status(400);
//     throw new Error('Location can only be updated for users with the role "Escort".');
//   }

//   const currentUser = req.user;

//   // Authorization Check (similar to updateEscortRates/SpecialServices)
//   if (
//     currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update location for another escort.');
//   } else if (
//     currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to update location for an escort not assigned to you.');
//   } else if (
//     currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
//   ) {
//     res.status(403);
//     throw new Error('Not authorized to perform this action.');
//   }

//   // Validate coordinates
//   if (typeof latitude !== 'number' || typeof longitude !== 'number') {
//     res.status(400);
//     throw new Error('Latitude and Longitude must be numbers.');
//   }
//   if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
//     res.status(400);
//     throw new Error('Invalid latitude or longitude values.');
//   }

//   // Update location
//   escort.location = {
//     type: 'Point',
//     coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
//   };
//   await escort.save();

//   res.json({
//     message: 'Escort location updated successfully',
//     escort: {
//       _id: escort._id,
//       name: escort.name,
//       role: escort.role,
//       location: escort.location,
//     },
//   });
// });


// module.exports = {
//   getAvailableEscorts,
//   toggleAvailability,
//   updateEscortRates,
//   updateEscortSpecialServices,
//   updateEscortLocation,
//   validate
// };
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');

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

// @desc    Get all available escorts
// @route   GET /api/escorts/available
// @access  Public
const getAvailableEscorts = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const name = req.query.name;
  const specialService = req.query.specialService;
  const sortBy = req.query.sortBy;
  const latitude = parseFloat(req.query.latitude);
  const longitude = parseFloat(req.query.longitude);
  const maxDistance = parseFloat(req.query.maxDistance) || 10000; // Default 10km

  const query = {
    role: 'Escort',
    // isAvailable: true, // Re-add this if you decide to filter by availability by default
  };

  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }

  if (specialService) {
    const allowedServices = ['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'];
    if (!allowedServices.includes(specialService)) {
      res.status(400);
      throw new Error(`Invalid special service filter: ${specialService}. Allowed values are: ${allowedServices.join(', ')}`);
    }
    query['specialServices.name'] = specialService;
  }

  // Geospatial query if latitude and longitude are provided
  if (!isNaN(latitude) && !isNaN(longitude)) {
    query['location.coordinates'] = { $exists: true }; // Ensure escort has a location set

    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
        },
        $maxDistance: maxDistance, // Distance in meters
      },
    };
  }

  // Sorting logic based on sortBy parameter
  let sortOptions = { createdAt: -1 }; // Default to recently added

  if (sortBy === 'recently_added') {
    sortOptions = { createdAt: -1 };
  } else if (sortBy === 'highest_rated') {
    sortOptions = { averageRating: -1 };
    query.numReviews = { $gt: 0 }; // Only show highly rated if they have reviews
  }

  const count = await User.countDocuments(query);
  const escorts = await User.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(sortOptions)
    .select('-password -fcmToken -resetPasswordToken -resetPasswordExpire'); // Exclude sensitive fields

  res.json({
    escorts,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Toggle availability for logged-in escort
// @route   PUT /api/escorts/availability
// @access  Private (Escort)
const toggleAvailability = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'Escort') {
    res.status(403);
    throw new Error('Not authorized to toggle availability. Only escorts can use this route for themselves.');
  }

  user.isAvailable = !user.isAvailable;
  await user.save();
  res.json({
      message: `Escort availability toggled to ${user.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: user.isAvailable
  });
});

// @desc    Update escort rates by escort, broker, or admin
// @route   PUT /api/escorts/:id/rates
// @access  Private (Escort, Broker, Admin)
const updateEscortRates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hourlyRate, dailyRate, brokerId } = req.body;

  const escort = await User.findById(id);

  if (!escort) {
    res.status(404);
    throw new Error('Escort not found.');
  }

  if (escort.role !== 'Escort') {
    res.status(400);
    throw new Error('Only users with the role "Escort" can have rates updated.');
  }

  const currentUser = req.user;

  if (
    currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update rates for another escort.');
  } else if (
    currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to update rates for an escort not assigned to you.');
  } else if (
    currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
  ) {
    res.status(403);
    throw new Error('Not authorized to perform this action.');
  }

  if (hourlyRate !== undefined) {
    escort.hourlyRate = hourlyRate;
  }
  if (dailyRate !== undefined) {
    escort.dailyRate = dailyRate;
  }

  if (brokerId !== undefined) {
      if (currentUser.role === 'Admin' || currentUser.role === 'Broker') {
          const newBroker = await User.findById(brokerId);
          if (!newBroker || newBroker.role !== 'Broker') {
              res.status(400);
              throw new Error('Invalid broker ID or user is not a Broker.');
          }
          escort.broker = newBroker._id;
      } else {
          res.status(403);
          throw new Error('Only Admin or Broker can assign/reassign an escort\'s broker.');
      }
  }

  await escort.save();

  res.json({
    message: 'Escort rates and/or broker updated successfully',
    escort: {
      _id: escort._id,
      name: escort.name,
      email: escort.email,
      role: escort.role,
      hourlyRate: escort.hourlyRate,
      dailyRate: escort.dailyRate,
      broker: escort.broker,
    },
  });
});

// @desc    Update escort's special services by escort, broker, or admin
// @route   PUT /api/escorts/:id/special-services
// @access  Private (Escort, Broker, Admin)
const updateEscortSpecialServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specialServices } = req.body;

  const escort = await User.findById(id);

  if (!escort) {
    res.status(404);
    throw new Error('Escort not found.');
  }

  if (escort.role !== 'Escort') {
    res.status(400);
    throw new Error('Special services can only be updated for users with the role "Escort".');
  }

  const currentUser = req.user;

  if (
    currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update special services for another escort.');
  } else if (
    currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to update special services for an escort not assigned to you.');
  } else if (
    currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
  ) {
    res.status(403);
    throw new Error('Not authorized to perform this action.');
  }

  if (!Array.isArray(specialServices)) {
    res.status(400);
    throw new Error('specialServices must be an array.');
  }

  const allowedServices = ['private_party', 'pool_party', 'rave_party', 'weekend_party', 'clubbing'];
  const newServices = [];

  for (const service of specialServices) {
    if (!service.name || !allowedServices.includes(service.name)) {
      res.status(400);
      throw new Error(`Invalid or missing service name: ${service.name}. Allowed values are: ${allowedServices.join(', ')}`);
    }
    if (typeof service.price !== 'number' || service.price < 0) {
      res.status(400);
      throw new Error(`Invalid or missing price for service ${service.name}. Price must be a non-negative number.`);
    }
    newServices.push({ name: service.name, price: service.price });
  }

  escort.specialServices = newServices;
  await escort.save();

  res.json({
    message: 'Escort special services updated successfully',
    escort: {
      _id: escort._id,
      name: escort.name,
      role: escort.role,
      specialServices: escort.specialServices,
    },
  });
});

// @desc    Update escort's location by escort, broker, or admin
// @route   PUT /api/escorts/:id/location
// @access  Private (Escort, Broker, Admin)
const updateEscortLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  const escort = await User.findById(id);

  if (!escort) {
    res.status(404);
    throw new Error('Escort not found.');
  }

  if (escort.role !== 'Escort') {
    res.status(400);
    throw new Error('Location can only be updated for users with the role "Escort".');
  }

  const currentUser = req.user;

  if (
    currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update location for another escort.');
  } else if (
    currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to update location for an escort not assigned to you.');
  } else if (
    currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
  ) {
    res.status(403);
    throw new Error('Not authorized to perform this action.');
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400);
    throw new Error('Latitude and Longitude must be numbers.');
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    res.status(400);
    throw new Error('Invalid latitude or longitude values.');
  }

  escort.location = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  await escort.save();

  res.json({
    message: 'Escort location updated successfully',
    escort: {
      _id: escort._id,
      name: escort.name,
      role: escort.role,
      location: escort.location,
    },
  });
});

// NEW: Add images/videos to escort profile
// @desc    Add media (images/videos) to an escort's profile
// @route   POST /api/escorts/:id/media
// @access  Private (Escort, Broker, Admin)
const addEscortMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mediaType, url } = req.body; // mediaType: 'image' or 'video'

  const escort = await User.findById(id);

  if (!escort) {
    res.status(404);
    throw new Error('Escort not found.');
  }

  if (escort.role !== 'Escort') {
    res.status(400);
    throw new Error('Media can only be added for users with the role "Escort".');
  }

  const currentUser = req.user;

  // Authorization Check
  if (
    currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to add media for another escort.');
  } else if (
    currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to add media for an escort not assigned to you.');
  } else if (
    currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
  ) {
    res.status(403);
    throw new Error('Not authorized to perform this action.');
  }

  if (!url || typeof url !== 'string' || !url.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i)) {
    res.status(400);
    throw new Error('Invalid media URL provided.');
  }

  if (mediaType === 'image') {
    escort.profileImages.push(url);
  } else if (mediaType === 'video') {
    escort.profileVideos.push(url);
  } else {
    res.status(400);
    throw new Error('Invalid media type. Must be "image" or "video".');
  }

  await escort.save();

  res.status(200).json({
    message: `${mediaType} added successfully.`,
    profileImages: escort.profileImages,
    profileVideos: escort.profileVideos,
  });
});

// NEW: Remove images/videos from escort profile
// @desc    Remove media (images/videos) from an escort's profile
// @route   DELETE /api/escorts/:id/media
// @access  Private (Escort, Broker, Admin)
const removeEscortMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mediaType, url } = req.body; // mediaType: 'image' or 'video'

  const escort = await User.findById(id);

  if (!escort) {
    res.status(404);
    throw new Error('Escort not found.');
  }

  if (escort.role !== 'Escort') {
    res.status(400);
    throw new Error('Media can only be removed for users with the role "Escort".');
  }

  const currentUser = req.user;

  // Authorization Check
  if (
    currentUser.role === 'Escort' && currentUser._id.toString() !== escort._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to remove media for another escort.');
  } else if (
    currentUser.role === 'Broker' && (!escort.broker || escort.broker.toString() !== currentUser._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to remove media for an escort not assigned to you.');
  } else if (
    currentUser.role !== 'Admin' && currentUser.role !== 'Escort' && currentUser.role !== 'Broker'
  ) {
    res.status(403);
    throw new Error('Not authorized to perform this action.');
  }

  if (!url || typeof url !== 'string') {
    res.status(400);
    throw new Error('Media URL is required for removal.');
  }

  let mediaRemoved = false;
  if (mediaType === 'image') {
    const initialLength = escort.profileImages.length;
    escort.profileImages = escort.profileImages.filter(img => img !== url);
    if (escort.profileImages.length < initialLength) {
      mediaRemoved = true;
    }
  } else if (mediaType === 'video') {
    const initialLength = escort.profileVideos.length;
    escort.profileVideos = escort.profileVideos.filter(vid => vid !== url);
    if (escort.profileVideos.length < initialLength) {
      mediaRemoved = true;
    }
  } else {
    res.status(400);
    throw new Error('Invalid media type. Must be "image" or "video".');
  }

  if (!mediaRemoved) {
    res.status(404);
    throw new Error(`${mediaType} URL not found in profile.`);
  }

  await escort.save();

  res.status(200).json({
    message: `${mediaType} removed successfully.`,
    profileImages: escort.profileImages,
    profileVideos: escort.profileVideos,
  });
});


module.exports = {
  getAvailableEscorts,
  toggleAvailability,
  updateEscortRates,
  updateEscortSpecialServices,
  updateEscortLocation,
  addEscortMedia, // Export new function
  removeEscortMedia, // Export new function
  validate
};