require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stakingRoutes = require('./routes/staking');
const blockchainService = require('./services/blockchain');
const Stake = require('./models/Stake');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staking-app';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        console.log('📁 Database:', MONGODB_URI);
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    });

// Initialize Blockchain Service
const RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
const NETWORK = process.env.NETWORK || 'sepolia';

async function initializeBlockchain() {
    if (!RPC_URL) {
        console.warn('⚠️  No RPC URL provided. Blockchain features will be disabled.');
        console.warn('Please set SEPOLIA_RPC_URL in your .env file');
        return;
    }

    const initialized = await blockchainService.initialize(RPC_URL, NETWORK);

    if (initialized) {
        // Set up event listeners
        blockchainService.listenToEvents(async (eventName, event) => {
            console.log(`📡 ${eventName} event detected:`, event.transactionHash);

            try {
                const { returnValues, transactionHash, blockNumber } = event;

                // Check if transaction already recorded
                const existing = await Stake.findOne({ transactionHash });
                if (existing) {
                    console.log('Transaction already recorded in database');
                    return;
                }

                // Record event in database
                const stakeData = {
                    userAddress: returnValues.user.toLowerCase(),
                    transactionHash,
                    blockNumber,
                    status: 'confirmed'
                };

                if (eventName === 'Staked') {
                    stakeData.amount = returnValues.amount.toString();
                    stakeData.action = 'stake';
                } else if (eventName === 'Unstaked') {
                    stakeData.amount = returnValues.amount.toString();
                    stakeData.action = 'unstake';
                } else if (eventName === 'RewardsClaimed') {
                    stakeData.amount = '0';
                    stakeData.action = 'claim';
                    stakeData.rewardAmount = returnValues.amount.toString();
                }

                const stake = new Stake(stakeData);
                await stake.save();

                console.log(`✅ ${eventName} event recorded in database`);
            } catch (error) {
                console.error(`Error recording ${eventName} event:`, error.message);
            }
        });
    }
}

initializeBlockchain();

// Routes
app.use('/api', stakingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        blockchain: blockchainService.initialized ? 'connected' : 'disconnected'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Staking Dapp Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            userStats: '/api/user/:address',
            allStakes: '/api/stakes',
            globalStats: '/api/stats',
            contracts: '/api/contracts'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error.message);
    res.status(error.status || 500).json({
        error: error.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('\n🚀 Staking Dapp Backend Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log('\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});
