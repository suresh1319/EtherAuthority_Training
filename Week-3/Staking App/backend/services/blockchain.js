const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

class BlockchainService {
    constructor() {
        this.web3 = null;
        this.stakingContract = null;
        this.stakingTokenContract = null;
        this.initialized = false;
    }

    /**
     * Initialize Web3 and contract instances
     */
    async initialize(rpcUrl, network = 'sepolia') {
        try {
            // Initialize Web3
            this.web3 = new Web3(rpcUrl);

            // Load deployment info
            const deploymentPath = path.join(__dirname, '../../deployments', `${network}.json`);

            if (!fs.existsSync(deploymentPath)) {
                console.warn(`⚠️  Deployment file not found: ${deploymentPath}`);
                console.warn('Please deploy contracts first using: npm run deploy');
                return false;
            }

            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

            // Load contract ABIs
            const stakingContractABI = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../artifacts/contracts/StakingContract.sol/StakingContract.json'), 'utf8')
            ).abi;

            const stakingTokenABI = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../artifacts/contracts/StakingToken.sol/StakingToken.json'), 'utf8')
            ).abi;

            // Create contract instances
            this.stakingContract = new this.web3.eth.Contract(
                stakingContractABI,
                deployment.contracts.StakingContract
            );

            this.stakingTokenContract = new this.web3.eth.Contract(
                stakingTokenABI,
                deployment.contracts.StakingToken
            );

            this.initialized = true;
            console.log('✅ Blockchain service initialized');
            console.log('📝 Staking Contract:', deployment.contracts.StakingContract);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize blockchain service:', error.message);
            return false;
        }
    }

    /**
     * Get user stake information
     */
    async getUserStake(address) {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            const stake = await this.stakingContract.methods.getUserStake(address).call();

            return {
                stakedAmount: stake.stakedAmount.toString(),
                stakedTimestamp: stake.stakedTimestamp.toString(),
                pendingRewards: stake.pendingRewards.toString(),
                rewardsClaimed: stake.rewardsClaimed.toString()
            };
        } catch (error) {
            console.error('Error fetching user stake:', error.message);
            throw error;
        }
    }

    /**
     * Get total staked amount
     */
    async getTotalStaked() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            const total = await this.stakingContract.methods.getTotalStaked().call();
            return total.toString();
        } catch (error) {
            console.error('Error fetching total staked:', error.message);
            throw error;
        }
    }

    /**
     * Get APY
     */
    async getAPY() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            const apy = await this.stakingContract.methods.getAPY().call();
            return parseInt(apy) / 100; // Convert basis points to percentage
        } catch (error) {
            console.error('Error fetching APY:', error.message);
            throw error;
        }
    }

    /**
     * Get token information
     */
    async getTokenInfo() {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            const [name, symbol, decimals] = await Promise.all([
                this.stakingTokenContract.methods.name().call(),
                this.stakingTokenContract.methods.symbol().call(),
                this.stakingTokenContract.methods.decimals().call()
            ]);

            return {
                name,
                symbol,
                decimals: parseInt(decimals)
            };
        } catch (error) {
            console.error('Error fetching token info:', error.message);
            throw error;
        }
    }

    /**
     * Get user token balance
     */
    async getTokenBalance(address) {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            const balance = await this.stakingTokenContract.methods.balanceOf(address).call();
            return balance.toString();
        } catch (error) {
            console.error('Error fetching token balance:', error.message);
            throw error;
        }
    }

    /**
     * Get contract addresses
     */
    getContractAddresses(network = 'sepolia') {
        const deploymentPath = path.join(__dirname, '../../deployments', `${network}.json`);

        if (!fs.existsSync(deploymentPath)) {
            return null;
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        return deployment.contracts;
    }

    /**
     * Listen to contract events
     */
    async listenToEvents(callback) {
        if (!this.initialized) throw new Error('Blockchain service not initialized');

        try {
            // Listen to Staked events
            const stakedSubscription = await this.stakingContract.events.Staked();
            stakedSubscription.on('data', (event) => {
                callback('Staked', event);
            });
            stakedSubscription.on('error', console.error);

            // Listen to Unstaked events
            const unstakedSubscription = await this.stakingContract.events.Unstaked();
            unstakedSubscription.on('data', (event) => {
                callback('Unstaked', event);
            });
            unstakedSubscription.on('error', console.error);

            // Listen to RewardsClaimed events
            const rewardsSubscription = await this.stakingContract.events.RewardsClaimed();
            rewardsSubscription.on('data', (event) => {
                callback('RewardsClaimed', event);
            });
            rewardsSubscription.on('error', console.error);

            console.log('👂 Listening to contract events...');
        } catch (error) {
            console.error('Error setting up event listeners:', error.message);
            // Don't throw - allow the app to continue without event listeners
            console.warn('⚠️  Event listening disabled. The app will still work, but events won\'t be automatically recorded.');
        }
    }
}

module.exports = new BlockchainService();
