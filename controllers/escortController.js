
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Desire = require('../models/Desires');

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

  const spotlight = req.query.spotlight === 'true';
  const vibe = req.query.vibe === 'true';
  const trendingThisWeek = req.query.trendingThisWeek === 'true';
  const worthSliding = req.query.worthSliding === 'true';
  const lateNight = req.query.lateNight === 'true';
  const newFace = req.query.newFace === 'true';

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized. User not logged in" });
  }
  const query = {
    role: "Escort",
  };

  if (name) {
    query.name = { $regex: name, $options: "i" };
  }


  // Geospatial query if latitude and longitude are provided
  if (!isNaN(latitude) && !isNaN(longitude)) {
    query["location.coordinates"] = { $exists: true }; // Ensure escort has a location set

    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
        },
        $maxDistance: maxDistance, // Distance in meters
      },
    };
  }

  // Sorting logic based on sortBy parameter
  let sortOptions = { createdAt: -1 }; // Default to recently added

  if (sortBy === "recently_added") {
    sortOptions = { createdAt: -1 };
  } else if (sortBy === "highest_rated") {
    sortOptions = { averageRating: -1 };
    query.numReviews = { $gt: 0 }; // Only show highly rated if they have reviews
  }

  if (trendingThisWeek) {
    sortOptions = { likedCount: -1 };
  }

  const uu = req.user;
  const currentUser = await User.findById(uu._id).select("desires");

  if (vibe) {
    if (currentUser && currentUser.desires) {
      const customerDesireIds = currentUser.desires.split(',').map(id => id.trim()).filter(id => id.length === 24);
      if (customerDesireIds.length > 0) {
        const regexPatterns = customerDesireIds.map(id => new RegExp(id, 'i'));
        query.desires = { $in: regexPatterns };
      } else {
        query._id = { $exists: false }; // No customer desires, result is empty
      }
    } else {
      query._id = { $exists: false }; // No customer desires, result is empty
    }
  }

  if (spotlight) {
    query.internalReview = { $gte: 8, $lte: 10 };
  }

  if (worthSliding) {
    query.hourlyRate = { $gte: 1000 };
  }

  if (lateNight) {
    query.lateNightStatus = 1;
  }

  if (newFace) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
  }

  const count = await User.countDocuments(query);
  let escorts = await User.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(sortOptions)
    .select(
      "-password -fcmToken -resetPasswordToken -resetPasswordExpire"
    ); // Exclude sensitive fields

  const favouritesSet = new Set(
    (currentUser.favourites || []).map((id) => id.toString())
  );

  // Fetch desires info
  const allDesireIds = new Set();
  escorts.forEach((escort) => {
    if (escort.desires) {
      escort.desires.split(",").forEach((id) => {
        const cleanId = id.trim();
        if (cleanId && cleanId.length === 24) allDesireIds.add(cleanId);
      });
    }
  });

  const desiresData = await Desire.find({ _id: { $in: Array.from(allDesireIds) } });
  const desiresMap = {};
  desiresData.forEach((d) => {
    desiresMap[d._id.toString()] = d;
  });

  escorts = escorts.map((escort) => {
    const escortObj = escort.toObject();
    escortObj.isFavourite = favouritesSet.has(escort._id.toString());

    if (escortObj.desires) {
      const desireIdsArr = escortObj.desires
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id && id.length === 24);
      escortObj.desires = desireIdsArr.map((id) => desiresMap[id]).filter((d) => d);
    } else {
      escortObj.desires = [];
    }

    return escortObj;
  });

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

const uploadEscortGallery = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(currentUser._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const fileNames = req.files.map(file => file.filename);

    user.profileImages = [...user.profileImages, ...fileNames];
    await user.save();

    res.status(200).json({
      message: 'Images uploaded successfully',
      profileImages: user.profileImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const uploadEscortProfilePhoto = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(currentUser._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const fileName = req.files.map(file => file.filename);

    user.profilePhoto = fileName;
    await user.save();

    res.status(200).json({
      message: 'Images uploaded successfully',
      profileImages: user.profileImages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const deleteEscortImage = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(currentUser._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const filename = req.query.fileName;

    user.profileImages = user.profileImages.filter(img => img !== filename);
    await user.save();

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});



const favouriteUnfavouriteEscort = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.user;
    const escortId = req.query.escortId;
    const user = await User.findById(currentUser._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favourites.includes(escortId)) {
      user.favourites.pull(escortId);
    } else {
      user.favourites.push(escortId);
    }

    await user.save();

    res.status(200).json({
      message: 'success',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const getFavouriteEscorts = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized. User not logged in" });
  }

  // Fetch current user's favourites
  const currentUser = await User.findById(req.user._id).select("favourites");
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Convert favourites into array of ObjectIds
  const favouriteIds = currentUser.favourites || [];

  if (favouriteIds.length === 0) {
    return res.json({
      escorts: [],
      page,
      pages: 0,
      total: 0,
    });
  }

  // Query escorts only from favourites
  const query = {
    _id: { $in: favouriteIds },
    role: "Escort",
  };

  const count = await User.countDocuments(query);

  let escorts = await User.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 }) // default sort (recently added)
    .select("-password -fcmToken -resetPasswordToken -resetPasswordExpire");

  // Mark each escort as favourite (always true here)
  escorts = escorts.map((escort) => {
    const escortObj = escort.toObject();
    escortObj.isFavourite = true;
    return escortObj;
  });

  res.json({
    escorts,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});


const updateProfile = asyncHandler(async (req, res) => {
  try {

    const disallowedFields = ['password', 'role', 'resetPasswordToken', 'resetPasswordExpire'];
    disallowedFields.forEach(field => delete req.body[field]);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Edit profile error:', error);
    res.status(500).json({ message: error.message });
  }

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

const getProfile = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const user = await User.findById(currentUser._id);

  res.status(200).json({
    user
  });

});


const incrementViewedCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const escort = await User.findById(id);

  if (!escort || escort.role !== 'Escort') {
    res.status(404);
    throw new Error('Escort not found.');
  }

  escort.viewedCount = (escort.viewedCount || 0) + 1;
  await escort.save();

  res.status(200).json({
    message: 'Viewed count incremented',
    viewedCount: escort.viewedCount
  });
});

const incrementLikedCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const escort = await User.findById(id);

  if (!escort || escort.role !== 'Escort') {
    res.status(404);
    throw new Error('Escort not found.');
  }

  escort.likedCount = (escort.likedCount || 0) + 1;
  await escort.save();

  res.status(200).json({
    message: 'Liked count incremented',
    likedCount: escort.likedCount
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

};