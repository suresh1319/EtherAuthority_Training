import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    totalStaked: {
        type: String,
        default: '0'
    },
    totalUnstaked: {
        type: String,
        default: '0'
    },
    totalSTKRewards: {
        type: String,
        default: '0'
    },
    totalGOVRewards: {
        type: String,
        default: '0'
    },
    transactionCount: {
        type: Number,
        default: 0
    },
    firstStakeDate: {
        type: Date
    },
    lastActivityDate: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model('UserStats', userStatsSchema);
