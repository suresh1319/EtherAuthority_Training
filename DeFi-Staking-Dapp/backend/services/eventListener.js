import { ethers } from 'ethers';
import Transaction from '../models/Transaction.js';
import UserStats from '../models/UserStats.js';

class EventListener {
    constructor(contractAddress, abi, rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contract = new ethers.Contract(contractAddress, abi, this.provider);
        this.isListening = false;
    }

    async start() {
        if (this.isListening) {
            console.log('Event listener already running');
            return;
        }

        console.log('Starting event listeners...');
        this.isListening = true;

        // Listen for Staked events
        this.contract.on('Staked', async (user, amount, lockPeriod, isLP, event) => {
            try {
                console.log('Staked event:', user, amount.toString());
                await this.handleStakedEvent(user, amount, lockPeriod, isLP, event);
            } catch (error) {
                console.error('Error handling Staked event:', error);
            }
        });

        // Listen for Unstaked events
        this.contract.on('Unstaked', async (user, amount, stkRewards, govRewards, event) => {
            try {
                console.log('Unstaked event:', user, amount.toString());
                await this.handleUnstakedEvent(user, amount, stkRewards, govRewards, event);
            } catch (error) {
                console.error('Error handling Unstaked event:', error);
            }
        });

        // Listen for RewardsClaimed events
        this.contract.on('RewardsClaimed', async (user, stkRewards, govRewards, event) => {
            try {
                console.log('RewardsClaimed event:', user, stkRewards.toString());
                await this.handleRewardsClaimedEvent(user, stkRewards, govRewards, event);
            } catch (error) {
                console.error('Error handling RewardsClaimed event:', error);
            }
        });

        // Listen for AutoCompounded events
        this.contract.on('AutoCompounded', async (user, amount, event) => {
            try {
                console.log('AutoCompounded event:', user, amount.toString());
                await this.handleAutoCompoundedEvent(user, amount, event);
            } catch (error) {
                console.error('Error handling AutoCompounded event:', error);
            }
        });

        console.log('Event listeners started successfully');
    }

    async handleStakedEvent(user, amount, lockPeriod, isLP, event) {
        const block = await event.getBlock();
        const txHash = event.log.transactionHash;

        const transaction = new Transaction({
            txHash,
            userAddress: user.toLowerCase(),
            type: 'STAKE',
            amount: ethers.formatUnits(amount, 18),
            lockPeriod: Number(lockPeriod),
            timestamp: new Date(block.timestamp * 1000),
            blockNumber: event.log.blockNumber,
            isLP
        });

        await transaction.save();
        await this.updateUserStats(user.toLowerCase(), transaction);
    }

    async handleUnstakedEvent(user, amount, stkRewards, govRewards, event) {
        const block = await event.getBlock();
        const txHash = event.log.transactionHash;

        const transaction = new Transaction({
            txHash,
            userAddress: user.toLowerCase(),
            type: 'UNSTAKE',
            amount: ethers.formatUnits(amount, 18),
            stkRewards: ethers.formatUnits(stkRewards, 18),
            govRewards: ethers.formatUnits(govRewards, 18),
            timestamp: new Date(block.timestamp * 1000),
            blockNumber: event.log.blockNumber
        });

        await transaction.save();
        await this.updateUserStats(user.toLowerCase(), transaction);
    }

    async handleRewardsClaimedEvent(user, stkRewards, govRewards, event) {
        const block = await event.getBlock();
        const txHash = event.log.transactionHash;

        const transaction = new Transaction({
            txHash,
            userAddress: user.toLowerCase(),
            type: 'CLAIM_REWARDS',
            amount: '0',
            stkRewards: ethers.formatUnits(stkRewards, 18),
            govRewards: ethers.formatUnits(govRewards, 18),
            timestamp: new Date(block.timestamp * 1000),
            blockNumber: event.log.blockNumber
        });

        await transaction.save();
        await this.updateUserStats(user.toLowerCase(), transaction);
    }

    async handleAutoCompoundedEvent(user, amount, event) {
        const block = await event.getBlock();
        const txHash = event.log.transactionHash;

        const transaction = new Transaction({
            txHash,
            userAddress: user.toLowerCase(),
            type: 'AUTO_COMPOUND',
            amount: ethers.formatUnits(amount, 18),
            timestamp: new Date(block.timestamp * 1000),
            blockNumber: event.log.blockNumber,
            autoCompound: true
        });

        await transaction.save();
        await this.updateUserStats(user.toLowerCase(), transaction);
    }

    async updateUserStats(address, transaction) {
        let stats = await UserStats.findOne({ address });

        if (!stats) {
            stats = new UserStats({
                address,
                firstStakeDate: transaction.timestamp
            });
        }

        // Update stats based on transaction type
        if (transaction.type === 'STAKE') {
            const current = parseFloat(stats.totalStaked);
            const add = parseFloat(transaction.amount);
            stats.totalStaked = (current + add).toString();
        } else if (transaction.type === 'UNSTAKE') {
            const current = parseFloat(stats.totalUnstaked);
            const add = parseFloat(transaction.amount);
            stats.totalUnstaked = (current + add).toString();
        }

        // Update rewards
        if (transaction.stkRewards) {
            const current = parseFloat(stats.totalSTKRewards);
            const add = parseFloat(transaction.stkRewards);
            stats.totalSTKRewards = (current + add).toString();
        }

        if (transaction.govRewards) {
            const current = parseFloat(stats.totalGOVRewards);
            const add = parseFloat(transaction.govRewards);
            stats.totalGOVRewards = (current + add).toString();
        }

        stats.transactionCount += 1;
        stats.lastActivityDate = transaction.timestamp;

        await stats.save();
    }

    stop() {
        if (this.isListening) {
            this.contract.removeAllListeners();
            this.isListening = false;
            console.log('Event listeners stopped');
        }
    }
}

export default EventListener;
