// const express = require('express');
// const {
//   getMyNotifications,
//   markNotificationAsRead,
// } = require('../controllers/notificationController');
// const { protect } = require('../middlewares/authMiddleware');

// const router = express.Router();

// router.get('/', protect, getMyNotifications);
// router.put('/:id/read', protect, markNotificationAsRead);

// module.exports = router;

const express = require('express');
const { param } = require('express-validator');
const {
  getMyNotifications,
  markNotificationAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware'); // Assuming validate utility is not needed here or is in notificationController

const router = express.Router();

// Get notifications for logged-in user
router.get('/', protect, getMyNotifications);

// Mark a notification as read
router.put(
  '/:id/read',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid Notification ID.'),
  ],
  (req, res, next) => { // Manual validation check if validate utility not imported
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
  markNotificationAsRead
);

module.exports = router;