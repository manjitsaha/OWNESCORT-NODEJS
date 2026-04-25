const Reel = require('../models/Reel');
const User = require('../models/User');
const Desire = require('../models/Desires');
const fs = require('fs');
const path = require('path');

// @desc    Upload a new reel
// @route   POST /api/reels/upload
// @access  Private
const uploadReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a video file' });
    }

    const { caption } = req.body;

    console.log(`req.user`, req.user);

    // Create new reel
    const reel = await Reel.create({
      user: req.user._id,
      videoUrl: `http://localhost:5001/uploads/${req.file.filename}`, // We'll use the path directly or you can map it to a domain URL later
      caption,
    });

    res.status(201).json({
      success: true,
      message: 'Reel uploaded successfully',
      data: reel,
    });
  } catch (error) {
    console.error(error);
    // Cleanup the uploaded file if DB insertion fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Error uploading reel' });
  }
};

// @desc    Stream a video reel
// @route   GET /api/reels/:id/stream
// @access  Public
const streamReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    const videoPath = path.join(__dirname, '../uploads/videos', reel.videoUrl);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, message: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Increment views in background if this is a fresh start request (no range or range starts at 0)
    // Note: browsers might send `bytes=0-` so we check string format.
    if (!range || range === 'bytes=0-') {
      Reel.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } }).exec();
    }

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4', // Setting to mp4, but it handles .mov etc cleanly on frontend
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error streaming reel' });
  }
};

// @desc    Get reels feed
// @route   GET /api/reels/feed
// @access  Public or Private depending on setup
const getReelsFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .populate('user')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const allDesireIds = new Set();
    reels.forEach(reel => {
      if (reel.user && reel.user.desires && typeof reel.user.desires === 'string') {
        const desireIdsArr = reel.user.desires
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id && id.length === 24);
        desireIdsArr.forEach(id => allDesireIds.add(id));
      }
    });

    const desiresData = await Desire.find({ _id: { $in: Array.from(allDesireIds) } });
    const desiresMap = {};
    desiresData.forEach((d) => {
      desiresMap[d._id.toString()] = d;
    });

    reels.forEach(reel => {
      if (reel.user) {
        if (reel.user.desires && typeof reel.user.desires === 'string') {
          const desireIdsArr = reel.user.desires
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id && id.length === 24);
          reel.user.desires = desireIdsArr.map((id) => desiresMap[id]).filter((d) => d);
        } else if (!reel.user.desires) {
          reel.user.desires = [];
        }
      }
    });

    const total = await Reel.countDocuments();

    res.status(200).json({
      success: true,
      count: reels.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: reels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching reels feed' });
  }
};

// @desc    Like or Unlike a reel
// @route   POST /api/reels/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    // Check if user already liked
    const index = reel.likes.indexOf(req.user._id);

    if (index === -1) {
      // Like
      reel.likes.push(req.user._id);
    } else {
      // Unlike
      reel.likes.splice(index, 1);
    }

    await reel.save();

    res.status(200).json({
      success: true,
      message: index === -1 ? 'Reel liked' : 'Reel unliked',
      data: {
        likesCount: reel.likes.length,
        isLiked: index === -1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
};

module.exports = {
  uploadReel,
  streamReel,
  getReelsFeed,
  toggleLike,
};
