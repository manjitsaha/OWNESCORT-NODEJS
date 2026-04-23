const express = require('express');
const {
  createArt,
  getAllArts,
  getArtsByEscort,
  getArtById,
  updateArt,
  deleteArt,
} = require('../controllers/artController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes
router.post('/', protect, createArt);
router.get('/', getAllArts);
router.get('/escort/:escortId', getArtsByEscort);
router.get('/:id', getArtById);
router.put('/:id', protect, updateArt);
router.delete('/:id', protect, deleteArt);

module.exports = router;
