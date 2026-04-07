const express = require('express');
const {
    getAllDesires,
    createDesire,
    getDesireById,
    updateDesire,
    deleteDesire,
    validate
} = require('../controllers/desiresController');

const router = express.Router();

router.post('/', validate, createDesire);
router.get('/', getAllDesires);
router.get('/:id', getDesireById);
router.put('/:id', validate, updateDesire);
router.delete('/:id', deleteDesire);

module.exports = router;