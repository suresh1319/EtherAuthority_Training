const { validationResult } = require('express-validator');
const Task = require('../models/Task');

// @desc    Submit a new task
// @route   POST /api/tasks/submit
// @access  Public
const submitTask = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const {
            title,
            description,
            internId,
            internName,
            submissionUrl,
            dueDate,
            priority,
        } = req.body;

        // Create new task
        const task = await Task.create({
            title,
            description,
            internId,
            internName,
            submissionUrl,
            submissionDate: submissionUrl ? new Date() : undefined,
            dueDate,
            priority,
            status: submissionUrl ? 'Submitted' : 'Pending',
        });

        res.status(201).json({
            success: true,
            message: 'Task submitted successfully',
            data: task,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
const getAllTasks = async (req, res, next) => {
    try {
        const { status, internId, priority, page = 1, limit = 10 } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (internId) filter.internId = internId;
        if (priority) filter.priority = priority;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get tasks with pagination
        const tasks = await Task.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Task.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: tasks.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Public
const getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.status(200).json({
            success: true,
            data: task,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
            });
        }
        next(error);
    }
};

// @desc    Get tasks by intern ID
// @route   GET /api/tasks/intern/:internId
// @access  Public
const getTasksByIntern = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        // Build filter
        const filter = { internId: req.params.internId };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tasks = await Task.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Task.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: tasks.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public
const updateTask = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const {
            title,
            description,
            submissionUrl,
            dueDate,
            status,
            priority,
        } = req.body;

        // Check if task exists
        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Update submission date if URL is provided and wasn't set before
        const updateData = {
            title,
            description,
            submissionUrl,
            dueDate,
            status,
            priority,
        };

        // If submissionUrl is being added and task didn't have one, set submission date
        if (submissionUrl && !task.submissionUrl) {
            updateData.submissionDate = new Date();
            if (!status) {
                updateData.status = 'Submitted';
            }
        }

        // Update task
        task = await Task.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: task,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
            });
        }
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Public
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
            data: {},
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
            });
        }
        next(error);
    }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Public
const updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status || !['Pending', 'Submitted', 'Reviewed', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Submitted, Reviewed, Approved, or Rejected',
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        task.status = status;
        await task.save();

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: task,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
            });
        }
        next(error);
    }
};

// @desc    Review task (add comments and score)
// @route   PATCH /api/tasks/:id/review
// @access  Public
const reviewTask = async (req, res, next) => {
    try {
        const { reviewerComments, score, status } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Update review fields
        if (reviewerComments !== undefined) task.reviewerComments = reviewerComments;
        if (score !== undefined) task.score = score;
        if (status) task.status = status;

        await task.save();

        res.status(200).json({
            success: true,
            message: 'Task reviewed successfully',
            data: task,
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
            });
        }
        next(error);
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats/summary
// @access  Public
const getTaskStats = async (req, res, next) => {
    try {
        const { internId } = req.query;

        const filter = internId ? { internId } : {};

        const stats = await Task.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$score' },
                },
            },
        ]);

        const totalTasks = await Task.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                totalTasks,
                byStatus: stats,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitTask,
    getAllTasks,
    getTaskById,
    getTasksByIntern,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reviewTask,
    getTaskStats,
};
