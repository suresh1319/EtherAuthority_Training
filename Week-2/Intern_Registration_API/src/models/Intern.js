const mongoose = require('mongoose');

const internSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        phone: {
            type: String,
            trim: true,
            match: [
                /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                'Please provide a valid phone number',
            ],
        },
        skills: {
            type: [String],
            default: [],
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        department: {
            type: String,
            trim: true,
            enum: {
                values: ['Engineering', 'Marketing', 'HR', 'Sales', 'Design', 'Other'],
                message: '{VALUE} is not a valid department',
            },
            default: 'Other',
        },
        mentor: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ['Active', 'Inactive', 'Completed'],
                message: '{VALUE} is not a valid status',
            },
            default: 'Active',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Create indexes for better query performance
internSchema.index({ email: 1 });
internSchema.index({ status: 1 });
internSchema.index({ department: 1 });

const Intern = mongoose.model('Intern', internSchema);

module.exports = Intern;
