const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Desire = require('../models/Desires');

// @desc    Get logged in customer profile
// @route   GET /api/customers/profile
// @access  Private (Customer)
const getCustomerProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '-password -resetPasswordToken -resetPasswordExpire'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const userObj = user.toObject();

  // Fetch desires info if available
  if (userObj.desires) {
    const desireIdsArr = userObj.desires
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id && id.length === 24);

    if (desireIdsArr.length > 0) {
      const desiresData = await Desire.find({ _id: { $in: desireIdsArr } });
      const desiresMap = {};
      desiresData.forEach((d) => {
        desiresMap[d._id.toString()] = d;
      });

      // Map the IDs to actual desire objects and filter out any that might not have been found
      userObj.desires = desireIdsArr.map((id) => desiresMap[id]).filter((d) => d);
    } else {
      userObj.desires = [];
    }
  } else {
    userObj.desires = [];
  }

  res.status(200).json({
    user: userObj,
  });
});

module.exports = {
  getCustomerProfile,
};
