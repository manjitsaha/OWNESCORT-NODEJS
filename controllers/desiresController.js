const Desire = require('../models/Desires');
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors,
    });
};

exports.createDesire = async (req, res) => {
    try {
        const { title, description } = req.body;
        const desire = await Desire.create({ title, description });
        res.status(201).json({ success: true, data: desire });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

exports.getAllDesires = async (req, res) => {
    try {
        const desires = await Desire.find();
        res.status(200).json({ success: true, data: desires });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

exports.getDesireById = async (req, res) => {
    try {
        const desire = await Desire.findById(req.params.id);
        res.status(200).json({ success: true, data: desire });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

exports.updateDesire = async (req, res) => {
    try {
        const { title, description } = req.body;
        const desire = await Desire.findByIdAndUpdate(req.params.id, { title, description }, { new: true });
        res.status(200).json({ success: true, data: desire });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

exports.deleteDesire = async (req, res) => {
    try {
        const desire = await Desire.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: desire });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}