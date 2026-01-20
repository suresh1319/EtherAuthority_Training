const express = require('express');
const router = express.Router();
const Stake = require('../models/Stake');
const blockchainService = require('../services/blockchain');

/**
 * GET /api/user/:address - Get user staking data
 */
router.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        // Get on-chain data
        const onChainData = await blockchainService.getUserStake(address.toLowerCase());

        // Get transaction history from database
        const history = await Stake.find({ userAddress: address.toLowerCase() })
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            address: address.toLowerCase(),
            stakedAmount: onChainData.stakedAmount,
            pendingRewards: onChainData.pendingRewards,
            totalRewardsClaimed: onChainData.rewardsClaimed,
            stakedSince: onChainData.stakedTimestamp !== '0'
                ? new Date(parseInt(onChainData.stakedTimestamp) * 1000).toISOString()
                : null,
            history
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/**
 * GET /api/stakes - Get all stakes with pagination
 */
router.get('/stakes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const stakes = await Stake.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Stake.countDocuments();

        res.json({
            stakes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching stakes:', error);
        res.status(500).json({ error: 'Failed to fetch stakes' });
    }
});

/**
 * POST /api/stake - Record stake transaction
 */
router.post('/stake', async (req, res) => {
    try {
        const { userAddress, amount, transactionHash, blockNumber } = req.body;

        // Validate required fields
        if (!userAddress || !amount || !transactionHash || !blockNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if transaction already exists
        const existing = await Stake.findOne({ transactionHash });
        if (existing) {
            return res.status(409).json({ error: 'Transaction already recorded' });
        }

        // Create new stake record
        const stake = new Stake({
            userAddress: userAddress.toLowerCase(),
            amount: amount.toString(),
            action: 'stake',
            transactionHash,
            blockNumber,
            status: 'confirmed'
        });

        await stake.save();

        res.status(201).json({
            message: 'Stake recorded successfully',
            stake
        });
    } catch (error) {
        console.error('Error recording stake:', error);
        res.status(500).json({ error: 'Failed to record stake' });
    }
});

/**
 * POST /api/unstake - Record unstake transaction
 */
router.post('/unstake', async (req, res) => {
    try {
        const { userAddress, amount, rewardAmount, transactionHash, blockNumber } = req.body;

        // Validate required fields
        if (!userAddress || !amount || !transactionHash || !blockNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if transaction already exists
        const existing = await Stake.findOne({ transactionHash });
        if (existing) {
            return res.status(409).json({ error: 'Transaction already recorded' });
        }

        // Create new unstake record
        const stake = new Stake({
            userAddress: userAddress.toLowerCase(),
            amount: amount.toString(),
            action: 'unstake',
            transactionHash,
            blockNumber,
            rewardAmount: rewardAmount?.toString() || '0',
            status: 'confirmed'
        });

        await stake.save();

        res.status(201).json({
            message: 'Unstake recorded successfully',
            stake
        });
    } catch (error) {
        console.error('Error recording unstake:', error);
        res.status(500).json({ error: 'Failed to record unstake' });
    }
});

/**
 * POST /api/claim - Record claim transaction
 */
router.post('/claim', async (req, res) => {
    try {
        const { userAddress, rewardAmount, transactionHash, blockNumber } = req.body;

        // Validate required fields
        if (!userAddress || !rewardAmount || !transactionHash || !blockNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if transaction already exists
        const existing = await Stake.findOne({ transactionHash });
        if (existing) {
            return res.status(409).json({ error: 'Transaction already recorded' });
        }

        // Create new claim record
        const stake = new Stake({
            userAddress: userAddress.toLowerCase(),
            amount: '0',
            action: 'claim',
            transactionHash,
            blockNumber,
            rewardAmount: rewardAmount.toString(),
            status: 'confirmed'
        });

        await stake.save();

        res.status(201).json({
            message: 'Claim recorded successfully',
            stake
        });
    } catch (error) {
        console.error('Error recording claim:', error);
        res.status(500).json({ error: 'Failed to record claim' });
    }
});

/**
 * GET /api/stats - Get global staking statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Get on-chain data
        const [totalStaked, apy, tokenInfo] = await Promise.all([
            blockchainService.getTotalStaked(),
            blockchainService.getAPY(),
            blockchainService.getTokenInfo()
        ]);

        // Get database statistics
        const uniqueUsersCount = await Stake.distinct('userAddress').then(users => users.length);
        const totalTransactions = await Stake.countDocuments();

        // Get total staked and unstaked amounts
        const stakeAggregation = await Stake.aggregate([
            {
                $group: {
                    _id: '$action',
                    total: { $sum: { $toDouble: '$amount' } }
                }
            }
        ]);

        const recentActivity = await Stake.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .select('userAddress action amount timestamp transactionHash');

        res.json({
            totalStaked,
            apy: `${apy}%`,
            tokenInfo,
            stats: {
                totalUsers: uniqueUsersCount,
                totalTransactions,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/contracts - Get contract addresses
 */
router.get('/contracts', (req, res) => {
    try {
        const network = req.query.network || 'sepolia';
        const addresses = blockchainService.getContractAddresses(network);

        if (!addresses) {
            return res.status(404).json({ error: 'Contract addresses not found' });
        }

        res.json({ network, contracts: addresses });
    } catch (error) {
        console.error('Error fetching contract addresses:', error);
        res.status(500).json({ error: 'Failed to fetch contract addresses' });
    }
});

module.exports = router;
