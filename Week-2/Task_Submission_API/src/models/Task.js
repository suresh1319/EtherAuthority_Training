const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters long'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        internId: {
            type: String,
            required: [true, 'Intern ID is required'],
            trim: true,
        },
        internName: {
            type: String,
            trim: true,
        },
        submissionUrl: {
            type: String,
            trim: true,
            match: [
                /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                'Please provide a valid URL',
            ],
        },
        submissionDate: {
            type: Date,
        },
        dueDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: {
                values: ['Pending', 'Submitted', 'Reviewed', 'Approved', 'Rejected'],
                message: '{VALUE} is not a valid status',
            },
            default: 'Pending',
        },
        reviewerComments: {
            type: String,
            trim: true,
            maxlength: [1000, 'Comments cannot exceed 1000 characters'],
        },
        score: {
            type: Number,
            min: [0, 'Score cannot be negative'],
            max: [100, 'Score cannot exceed 100'],
        },
        priority: {
            type: String,
            enum: {
                values: ['Low', 'Medium', 'High'],
                message: '{VALUE} is not a valid priority',
            },
            default: 'Medium',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Create indexes for better query performance
taskSchema.index({ internId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ submissionDate: 1 });

// Virtual field to check if task is overdue
taskSchema.virtual('isOverdue').get(function () {
    if (this.dueDate && this.status !== 'Submitted' && this.status !== 'Approved') {
        return new Date() > this.dueDate;
    }
    return false;
});

// Ensure virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
