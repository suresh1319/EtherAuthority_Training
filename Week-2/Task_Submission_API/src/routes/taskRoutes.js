const express = require('express');
const { body } = require('express-validator');
const {
    submitTask,
    getAllTasks,
    getTaskById,
    getTasksByIntern,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reviewTask,
    getTaskStats,
} = require('../controllers/taskController');

const router = express.Router();

// Validation rules for task submission/update
const taskValidationRules = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    body('internId')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Intern ID cannot be empty'),
    body('internName')
        .optional()
        .trim(),
    body('submissionUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid URL'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('status')
        .optional()
        .isIn(['Pending', 'Submitted', 'Reviewed', 'Approved', 'Rejected'])
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High'])
        .withMessage('Invalid priority'),
];

// Required fields for task submission
const submissionValidationRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('internId')
        .trim()
        .notEmpty()
        .withMessage('Intern ID is required'),
    ...taskValidationRules.slice(3), // Include optional fields
];

// Routes
router.post('/submit', submissionValidationRules, submitTask);
router.get('/stats/summary', getTaskStats);
router.get('/intern/:internId', getTasksByIntern);
router.get('/:id', getTaskById);
router.get('/', getAllTasks);
router.put('/:id', taskValidationRules, updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/review', reviewTask);

module.exports = router;
