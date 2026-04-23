const Art = require('../models/Art');

// @desc    Create a new art entry
// @route   POST /api/arts
// @access  Private
const createArt = async (req, res) => {
  try {
    const { escortId, art } = req.body;

    if (!escortId || !art) {
      return res.status(400).json({ success: false, message: 'escortId and art are required' });
    }

    const newArt = await Art.create({ escortId, art });

    res.status(201).json({
      success: true,
      message: 'Art created successfully',
      data: newArt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating art' });
  }
};

// @desc    Get all arts
// @route   GET /api/arts
// @access  Public
const getAllArts = async (req, res) => {
  try {
    const arts = await Art.find().populate('escortId', 'name email profilePic').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: arts.length,
      data: arts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching arts' });
  }
};

// @desc    Get arts by escort ID
// @route   GET /api/arts/escort/:escortId
// @access  Public
const getArtsByEscort = async (req, res) => {
  try {
    const arts = await Art.find({ escortId: req.params.escortId })
      .populate('escortId', 'name email profilePic')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: arts.length,
      data: arts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching arts for escort' });
  }
};

// @desc    Get single art by ID
// @route   GET /api/arts/:id
// @access  Public
const getArtById = async (req, res) => {
  try {
    const art = await Art.findById(req.params.id).populate('escortId', 'name email profilePic');

    if (!art) {
      return res.status(404).json({ success: false, message: 'Art not found' });
    }

    res.status(200).json({
      success: true,
      data: art,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching art' });
  }
};

// @desc    Update an art entry
// @route   PUT /api/arts/:id
// @access  Private
const updateArt = async (req, res) => {
  try {
    const { art } = req.body;

    const updatedArt = await Art.findByIdAndUpdate(
      req.params.id,
      { art },
      { new: true, runValidators: true }
    );

    if (!updatedArt) {
      return res.status(404).json({ success: false, message: 'Art not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Art updated successfully',
      data: updatedArt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating art' });
  }
};

// @desc    Delete an art entry
// @route   DELETE /api/arts/:id
// @access  Private
const deleteArt = async (req, res) => {
  try {
    const art = await Art.findByIdAndDelete(req.params.id);

    if (!art) {
      return res.status(404).json({ success: false, message: 'Art not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Art deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error deleting art' });
  }
};

module.exports = {
  createArt,
  getAllArts,
  getArtsByEscort,
  getArtById,
  updateArt,
  deleteArt,
};
