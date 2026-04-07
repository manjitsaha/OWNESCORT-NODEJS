const express = require('express');
const { body, param } = require('express-validator');
const {
    getAllDesires,
    validate
} = require('../controllers/desiresController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware'); // Corrected import

const router = express.Router();

// router.post(
//     '/',
//     protect,

//     validate,
//     createDesire
// );

router.get(
    '/',
    getAllDesires
);

module.exports = router;