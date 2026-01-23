import express from 'express';
import Transaction from '../models/Transaction.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// Get transaction history for a user
router.get('/transactions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        const transactions = await Transaction.find({
            userAddress: address.toLowerCase()
        })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Transaction.countDocuments({
            userAddress: address.toLowerCase()
        });

        res.json({
            success: true,
            data: transactions,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user statistics
router.get('/stats/user/:address', async (req, res) => {
    try {
        const { address } = req.params;

        let stats = await UserStats.findOne({
            address: address.toLowerCase()
        });

        if (!stats) {
            stats = {
                address: address.toLowerCase(),
                totalStaked: '0',
                totalUnstaked: '0',
                totalSTKRewards: '0',
                totalGOVRewards: '0',
                transactionCount: 0
            };
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get protocol-wide statistics
router.get('/stats/protocol', async (req, res) => {
    try {
        const totalTransactions = await Transaction.countDocuments();
        const uniqueUsers = await Transaction.distinct('userAddress');

        const recentTransactions = await Transaction.find()
            .sort({ timestamp: -1 })
            .limit(10);

        // Calculate total volumes
        const stakes = await Transaction.find({ type: 'STAKE' });
        const unstakes = await Transaction.find({ type: 'UNSTAKE' });

        const totalStakeVolume = stakes.reduce((sum, tx) => {
            return sum + parseFloat(tx.amount);
        }, 0);

        const totalUnstakeVolume = unstakes.reduce((sum, tx) => {
            return sum + parseFloat(tx.amount);
        }, 0);

        const totalRewardsPaid = unstakes.reduce((sum, tx) => {
            return sum + parseFloat(tx.stkRewards || 0);
        }, 0);

        res.json({
            success: true,
            data: {
                totalTransactions,
                uniqueUsers: uniqueUsers.length,
                totalStakeVolume: totalStakeVolume.toString(),
                totalUnstakeVolume: totalUnstakeVolume.toString(),
                totalRewardsPaid: totalRewardsPaid.toString(),
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching protocol stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manual sync endpoint (optional - for backfilling)
router.post('/sync/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // This would trigger a resync of the user's transactions
        // Implementation depends on your event listener setup

        res.json({
            success: true,
            message: 'Sync initiated for ' + address
        });
    } catch (error) {
        console.error('Error syncing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
