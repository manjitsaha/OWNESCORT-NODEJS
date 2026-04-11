const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute path to /uploads/videos folder at project root
const uploadDir = path.join(process.cwd(), 'uploads', 'videos');

// Ensure the folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // save to uploads/videos
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'reel-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to allow only videos
const fileFilter = (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.webm', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Also check mimetype as a secondary measure
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed!'), false);
    }
};

// Limiting video size to 50MB
const uploadVideo = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = uploadVideo;
