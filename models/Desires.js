const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const desiresSchema = mongoose.Schema(
    {
        icon: {
            type: String,
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

const Desire = mongoose.model('Desire', desiresSchema);

module.exports = Desire;