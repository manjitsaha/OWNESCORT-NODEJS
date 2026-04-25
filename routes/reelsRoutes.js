const express = require('express');
const {
  uploadReel,
  streamReel,
  getReelsFeed,
  toggleLike,
} = require('../controllers/reelsController');
const { protect } = require('../middlewares/authMiddleware');
const uploadVideo = require('../middlewares/uploadVideo');

const router = express.Router();

// Routes
router.post('/upload', protect, uploadVideo.single('video'), uploadReel);
router.get('/feed', protect, getReelsFeed); // Making feed protected to know which user is viewing. Or can drop `protect` if public.
router.get('/:id/stream', streamReel); // Public for easy streaming in <video> tags
router.post('/:id/like', protect, toggleLike);

module.exports = router;
