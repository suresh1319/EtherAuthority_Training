import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './routes/api.js';
import EventListener from './services/eventListener.js';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/defi-staking-dapp';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Load contract ABI
const stakingContractABI = JSON.parse(
    readFileSync(
        join(__dirname, '../artifacts/contracts/DeFiStakingContract.sol/DeFiStakingContract.json'),
        'utf-8'
    )
).abi;

// Initialize Event Listener
let eventListener;

if (process.env.SEPOLIA_RPC_URL && process.env.VITE_STAKING_CONTRACT_ADDRESS) {
    eventListener = new EventListener(
        process.env.VITE_STAKING_CONTRACT_ADDRESS,
        stakingContractABI,
        process.env.SEPOLIA_RPC_URL
    );

    // Start listening for events
    eventListener.start().catch(console.error);
} else {
    console.warn('⚠️  RPC URL or Contract Address not configured. Event listener not started.');
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (eventListener) {
        eventListener.stop();
    }
    await mongoose.connection.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default app;
