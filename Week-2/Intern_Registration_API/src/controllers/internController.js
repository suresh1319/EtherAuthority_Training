const { validationResult } = require('express-validator');
const Intern = require('../models/Intern');

// @desc    Register a new intern
// @route   POST /api/interns/register
// @access  Public
const registerIntern = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { name, email, phone, skills, startDate, department, mentor } = req.body;

        // Check if intern with email already exists
        const existingIntern = await Intern.findOne({ email });
        if (existingIntern) {
            return res.status(409).json({
                success: false,
                message: 'An intern with this email already exists',
            });
        }

        // Create new intern
        const intern = await Intern.create({
            name,
            email,
            phone,
            skills,
            startDate,
            department,
            mentor,
        });

        res.status(201).json({
            success: true,
            message: 'Intern registered successfully',
            data: intern,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all interns
// @route   GET /api/interns
// @access  Public
const getAllInterns = async (req, res, next) => {
    try {
        const { status, department, page = 1, limit = 10 } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (department) filter.department = department;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get interns with pagination
        const interns = await Intern.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Intern.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: interns.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: interns,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get intern by ID
// @route   GET /api/interns/:id
// @access  Public
const getInternById = async (req, res, next) => {
    try {
        const intern = await Intern.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found',
            });
        }

        res.status(200).json({
            success: true,
            data: intern,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid intern ID format',
            });
        }
        next(error);
    }
};

// @desc    Update intern
// @route   PUT /api/interns/:id
// @access  Public
const updateIntern = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { name, email, phone, skills, startDate, department, mentor, status } = req.body;

        // Check if intern exists
        let intern = await Intern.findById(req.params.id);
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found',
            });
        }

        // If email is being changed, check if new email already exists
        if (email && email !== intern.email) {
            const existingIntern = await Intern.findOne({ email });
            if (existingIntern) {
                return res.status(409).json({
                    success: false,
                    message: 'An intern with this email already exists',
                });
            }
        }

        // Update intern
        intern = await Intern.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, skills, startDate, department, mentor, status },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Intern updated successfully',
            data: intern,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid intern ID format',
            });
        }
        next(error);
    }
};

// @desc    Delete intern
// @route   DELETE /api/interns/:id
// @access  Public
const deleteIntern = async (req, res, next) => {
    try {
        const intern = await Intern.findById(req.params.id);

        if (!intern) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found',
            });
        }

        await Intern.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Intern deleted successfully',
            data: {},
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid intern ID format',
            });
        }
        next(error);
    }
};

// @desc    Update intern status
// @route   PATCH /api/interns/:id/status
// @access  Public
const updateInternStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status || !['Active', 'Inactive', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Active, Inactive, or Completed',
            });
        }

        const intern = await Intern.findById(req.params.id);
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: 'Intern not found',
            });
        }

        intern.status = status;
        await intern.save();

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: intern,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid intern ID format',
            });
        }
        next(error);
    }
};

module.exports = {
    registerIntern,
    getAllInterns,
    getInternById,
    updateIntern,
    deleteIntern,
    updateInternStatus,
};
