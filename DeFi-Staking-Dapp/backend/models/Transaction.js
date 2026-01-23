import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    txHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userAddress: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['STAKE', 'UNSTAKE', 'CLAIM_REWARDS', 'AUTO_COMPOUND'],
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    lockPeriod: {
        type: Number,
        enum: [0, 1, 2, 3], // FLEXIBLE, DAYS_30, DAYS_60, DAYS_90
    },
    stkRewards: {
        type: String,
        default: '0'
    },
    govRewards: {
        type: String,
        default: '0'
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    isLP: {
        type: Boolean,
        default: false
    },
    autoCompound: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
transactionSchema.index({ userAddress: 1, timestamp: -1 });

export default mongoose.model('Transaction', transactionSchema);
