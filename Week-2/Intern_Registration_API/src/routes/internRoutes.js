const express = require('express');
const { body } = require('express-validator');
const {
    registerIntern,
    getAllInterns,
    getInternById,
    updateIntern,
    deleteIntern,
    updateInternStatus,
} = require('../controllers/internController');

const router = express.Router();

// Validation rules for intern registration/update
const internValidationRules = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
        .withMessage('Please provide a valid phone number'),
    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('department')
        .optional()
        .isIn(['Engineering', 'Marketing', 'HR', 'Sales', 'Design', 'Other'])
        .withMessage('Invalid department'),
    body('mentor')
        .optional()
        .trim(),
    body('status')
        .optional()
        .isIn(['Active', 'Inactive', 'Completed'])
        .withMessage('Invalid status'),
];

// Required fields for registration
const registrationValidationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    ...internValidationRules.slice(2), // Include optional fields
];

// Routes
router.post('/register', registrationValidationRules, registerIntern);
router.get('/', getAllInterns);
router.get('/:id', getInternById);
router.put('/:id', internValidationRules, updateIntern);
router.delete('/:id', deleteIntern);
router.patch('/:id/status', updateInternStatus);

module.exports = router;
