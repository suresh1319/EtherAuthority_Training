const mongoose = require('mongoose');

const stakeSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    amount: {
        type: String, // Store as string to handle BigNumber values
        required: true
    },
    action: {
        type: String,
        enum: ['stake', 'unstake', 'claim'],
        required: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    rewardAmount: {
        type: String,
        default: '0'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'confirmed'
    }
}, {
    timestamps: true
});

// Index for faster queries
stakeSchema.index({ userAddress: 1, timestamp: -1 });
stakeSchema.index({ transactionHash: 1 });

const Stake = mongoose.model('Stake', stakeSchema);

module.exports = Stake;
