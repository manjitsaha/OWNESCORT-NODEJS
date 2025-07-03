// const asyncHandler = require('express-async-handler');
// const admin = require('../config/firebase');
// const Notification = require('../models/Notification');

// const sendPushNotification = async (fcmToken, title, body, data = {}) => {
//   if (!fcmToken) {
//     console.warn('No FCM token provided for notification.');
//     return;
//   }

//   const message = {
//     notification: {
//       title: title,
//       body: body,
//     },
//     data: data,
//     token: fcmToken,
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     console.log('Successfully sent message:', response);
//   } catch (error) {
//     console.error('Error sending message:', error);
//   }
// };

// const getMyNotifications = asyncHandler(async (req, res) => {
//   const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
//   res.status(200).json(notifications);
// });

// const markNotificationAsRead = asyncHandler(async (req, res) => {
//   const notification = await Notification.findById(req.params.id);

//   if (!notification) {
//     res.status(404);
//     throw new Error('Notification not found');
//   }

//   if (notification.recipient.toString() !== req.user._id.toString()) {
//     res.status(403);
//     throw new Error('Not authorized to update this notification');
//   }

//   notification.read = true;
//   await notification.save();
//   res.status(200).json(notification);
// });

// // This function is for internal use, called by other controllers to create in-app notifications
// const createInAppNotification = asyncHandler(async (recipientId, title, body, type, data = {}) => {
//     try {
//         const notification = await Notification.create({
//             recipient: recipientId,
//             title,
//             body,
//             type,
//             data,
//         });
//         console.log(`In-app notification created for ${recipientId}: ${title}`);
//         return notification;
//     } catch (error) {
//         console.error('Error creating in-app notification:', error);
//         // Do not throw error here, as it's a background task. Just log.
//     }
// });


// module.exports = {
//   sendPushNotification,
//   getMyNotifications,
//   markNotificationAsRead,
//   createInAppNotification,
// };

const asyncHandler = require('express-async-handler');
const admin = require('../config/firebase'); // Firebase Admin SDK
const Notification = require('../models/Notification'); // Our Mongoose model

// Function to send a push notification (called by other controllers)
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.warn('No FCM token provided for notification.');
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data, // Custom data payload
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent push notification:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found.');
  }

  // Ensure user owns the notification
  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this notification.');
  }

  notification.read = true;
  await notification.save();
  res.status(200).json(notification);
});

// @desc    Create a new in-app notification (for internal use, or if you want to expose an API)
// This function is called by other controllers (e.g., bookingController)
const createInAppNotification = asyncHandler(async (recipientId, title, body, type, data = {}) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            title,
            body,
            type,
            data,
        });
        console.log(`In-app notification created for ${recipientId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('Error creating in-app notification:', error);
        // Do not throw error here, as it's a background task. Just log.
    }
});


module.exports = {
  sendPushNotification,
  getMyNotifications,
  markNotificationAsRead,
  createInAppNotification,
};