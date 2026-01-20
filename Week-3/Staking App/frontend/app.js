// Configuration
const BACKEND_API = 'http://localhost:3000/api';
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
const EXPLORER_URL = 'https://sepolia.etherscan.io';

// Global state
let web3;
let currentAccount;
let stakingContract;
let tokenContract;
let contractAddresses = {};
let approvedAmount = BigInt(0);

// Contract ABIs (will be loaded dynamically)
let stakingContractABI;
let tokenContractABI;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadContractInfo();
    checkMetaMask();
    setupEventListeners();
});

// Check if MetaMask is installed
function checkMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('✅ MetaMask detected');

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Listen for chain changes
        window.ethereum.on('chainChanged', () => window.location.reload());

        // Check if already connected
        checkExistingConnection();
    } else {
        showToast('Please install MetaMask to use this app', 'error');
        console.error('❌ MetaMask not detected');
    }
}

// Check for existing connection
async function checkExistingConnection() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await handleAccountsChanged(accounts);
        }
    } catch (error) {
        console.error('Error checking connection:', error);
    }
}

// Connect wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Please install MetaMask!', 'error');
        return;
    }

    try {
        showLoading(true);

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        await handleAccountsChanged(accounts);
        showToast('Wallet connected successfully!', 'success');
    } catch (error) {
        console.error('Connection error:', error);
        showToast('Failed to connect wallet', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        currentAccount = null;
        updateUIState(false);
    } else {
        currentAccount = accounts[0];
        console.log('Connected account:', currentAccount);

        // Initialize Web3
        web3 = new Web3(window.ethereum);

        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== SEPOLIA_CHAIN_ID) {
            await switchToSepolia();
        }

        // Initialize contracts
        await initializeContracts();

        // Update UI
        updateUIState(true);

        // Load data
        await loadDashboardData();
    }
}

// Switch to Sepolia network
async function switchToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
    } catch (error) {
        if (error.code === 4902) {
            showToast('Please add Sepolia network to MetaMask', 'error');
        } else {
            showToast('Please switch to Sepolia network', 'error');
        }
        throw error;
    }
}

// Load contract information from backend
async function loadContractInfo() {
    try {
        const response = await fetch(`${BACKEND_API}/contracts?network=sepolia`);
        const data = await response.json();

        if (data.contracts) {
            contractAddresses = data.contracts;
            console.log('✅ Contract addresses loaded:', contractAddresses);
        }
    } catch (error) {
        console.error('Error loading contract info:', error);
        showToast('Could not load contract addresses. Please deploy contracts first.', 'error');
    }
}

// Initialize contract instances
async function initializeContracts() {
    if (!contractAddresses.StakingToken || !contractAddresses.StakingContract) {
        console.error('Contract addresses not loaded');
        return;
    }

    try {
        // Load ABIs from artifacts (in production, these would be bundled)
        const tokenABI = [{ "inputs": [{ "internalType": "uint256", "name": "initialSupply", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

        const stakingABI = [{ "inputs": [{ "internalType": "address", "name": "_stakingToken", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "EnforcedPause", "type": "error" }, { "inputs": [], "name": "ExpectedPause", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "SafeERC20FailedOperation", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "EmergencyWithdraw", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "RewardsClaimed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "Staked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "name": "Unstaked", "type": "event" }, { "inputs": [], "name": "BASIS_POINTS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "REWARD_RATE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "SECONDS_PER_YEAR", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "calculateRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "claimRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "fundRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getAPY", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "getContractBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getTotalStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getUserStake", "outputs": [{ "internalType": "uint256", "name": "stakedAmount", "type": "uint256" }, { "internalType": "uint256", "name": "stakedTimestamp", "type": "uint256" }, { "internalType": "uint256", "name": "pendingRewards", "type": "uint256" }, { "internalType": "uint256", "name": "rewardsClaimed", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "stakes", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }, { "internalType": "uint256", "name": "rewardDebt", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "stakingToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalRewardsPaid", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

        tokenContract = new web3.eth.Contract(tokenABI, contractAddresses.StakingToken);
        stakingContract = new web3.eth.Contract(stakingABI, contractAddresses.StakingContract);

        console.log('✅ Contracts initialized');

        // Check allowance
        await checkAllowance();
    } catch (error) {
        console.error('Error initializing contracts:', error);
    }
}

// Check token allowance
async function checkAllowance() {
    try {
        const allowance = await tokenContract.methods
            .allowance(currentAccount, contractAddresses.StakingContract)
            .call();

        approvedAmount = BigInt(allowance);

        if (approvedAmount > 0) {
            document.getElementById('stakeBtn').disabled = false;
        }
    } catch (error) {
        console.error('Error checking allowance:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load blockchain data
        const [tokenBalance, totalStaked, userStake] = await Promise.all([
            tokenContract.methods.balanceOf(currentAccount).call(),
            stakingContract.methods.getTotalStaked().call(),
            stakingContract.methods.getUserStake(currentAccount).call()
        ]);

        // Update UI
        document.getElementById('tokenBalance').textContent = formatTokenAmount(tokenBalance);
        document.getElementById('totalStaked').textContent = formatTokenAmount(totalStaked) + ' STK';
        document.getElementById('userStaked').textContent = formatTokenAmount(userStake.stakedAmount) + ' STK';
        document.getElementById('pendingRewards').textContent = formatTokenAmount(userStake.pendingRewards) + ' STK';
        document.getElementById('rewardsValue').textContent = formatTokenAmount(userStake.pendingRewards) + ' STK';

        // Load transaction history
        await loadTransactionHistory();

        // Set up auto-refresh
        setInterval(refreshRewards, 10000); // Refresh every 10 seconds
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Refresh rewards display
async function refreshRewards() {
    if (!currentAccount || !stakingContract) return;

    try {
        const userStake = await stakingContract.methods.getUserStake(currentAccount).call();
        document.getElementById('pendingRewards').textContent = formatTokenAmount(userStake.pendingRewards) + ' STK';
        document.getElementById('rewardsValue').textContent = formatTokenAmount(userStake.pendingRewards) + ' STK';
    } catch (error) {
        console.error('Error refreshing rewards:', error);
    }
}

// Load transaction history from backend
async function loadTransactionHistory() {
    try {
        const response = await fetch(`${BACKEND_API}/user/${currentAccount}`);
        const data = await response.json();

        const historyContainer = document.getElementById('transactionHistory');

        if (!data.history || data.history.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state-small">
                    <div class="empty-state-icon-small">📝</div>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = data.history.map(tx => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-action ${tx.action}">${capitalizeFirst(tx.action)}</div>
                    <div class="transaction-meta">${formatDate(tx.timestamp)}</div>
                    <div class="transaction-hash">
                        <a href="${EXPLORER_URL}/tx/${tx.transactionHash}" target="_blank" rel="noopener">
                            ${tx.transactionHash.substring(0, 10)}...${tx.transactionHash.substring(tx.transactionHash.length - 8)}
                        </a>
                    </div>
                </div>
                <div class="transaction-amount">
                    ${tx.action === 'unstake' || tx.action === 'stake'
                ? formatTokenAmount(tx.amount) + ' STK'
                : formatTokenAmount(tx.rewardAmount) + ' STK'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transaction history:', error);
    }
}

// Approve tokens
async function approveTokens() {
    const amount = document.getElementById('stakeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter an amount to approve', 'error');
        return;
    }

    try {
        showLoading(true);

        const weiAmount = web3.utils.toWei(amount, 'ether');

        const tx = await tokenContract.methods
            .approve(contractAddresses.StakingContract, weiAmount)
            .send({ from: currentAccount });

        console.log('Approval transaction:', tx);

        approvedAmount = BigInt(weiAmount);
        document.getElementById('stakeBtn').disabled = false;

        showToast('Tokens approved successfully!', 'success');
    } catch (error) {
        console.error('Approval error:', error);
        showToast(error.message || 'Failed to approve tokens', 'error');
    } finally {
        showLoading(false);
    }
}

//Stake tokens
async function stake() {
    const amount = document.getElementById('stakeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter an amount to stake', 'error');
        return;
    }

    try {
        showLoading(true);

        const weiAmount = web3.utils.toWei(amount, 'ether');

        const tx = await stakingContract.methods
            .stake(weiAmount)
            .send({ from: currentAccount });

        console.log('Stake transaction:', tx);

        // Record in backend
        await fetch(`${BACKEND_API}/stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: currentAccount,
                amount: weiAmount.toString(),
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            })
        });

        showToast('Tokens staked successfully!', 'success');

        // Clear input and refresh data
        document.getElementById('stakeAmount').value = '';
        await loadDashboardData();
    } catch (error) {
        console.error('Stake error:', error);
        showToast(error.message || 'Failed to stake tokens', 'error');
    } finally {
        showLoading(false);
    }
}

// Unstake tokens
async function unstake() {
    const amount = document.getElementById('unstakeAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter an amount to unstake', 'error');
        return;
    }

    try {
        showLoading(true);

        const weiAmount = web3.utils.toWei(amount, 'ether');

        const tx = await stakingContract.methods
            .unstake(weiAmount)
            .send({ from: currentAccount });

        console.log('Unstake transaction:', tx);

        // Record in backend
        await fetch(`${BACKEND_API}/unstake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: currentAccount,
                amount: weiAmount.toString(),
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            })
        });

        showToast('Tokens unstaked successfully!', 'success');

        // Clear input and refresh data
        document.getElementById('unstakeAmount').value = '';
        await loadDashboardData();
    } catch (error) {
        console.error('Unstake error:', error);
        showToast(error.message || 'Failed to unstake tokens', 'error');
    } finally {
        showLoading(false);
    }
}

// Claim rewards
async function claimRewards() {
    try {
        showLoading(true);

        const tx = await stakingContract.methods
            .claimRewards()
            .send({ from: currentAccount });

        console.log('Claim transaction:', tx);

        // Record in backend
        const userStake = await stakingContract.methods.getUserStake(currentAccount).call();
        await fetch(`${BACKEND_API}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: currentAccount,
                rewardAmount: userStake.pendingRewards.toString(),
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            })
        });

        showToast('Rewards claimed successfully!', 'success');

        // Refresh data
        await loadDashboardData();
    } catch (error) {
        console.error('Claim error:', error);
        showToast(error.message || 'Failed to claim rewards', 'error');
    } finally {
        showLoading(false);
    }
}

// Set max stake amount
async function setMaxStake() {
    try {
        const balance = await tokenContract.methods.balanceOf(currentAccount).call();
        const ethBalance = web3.utils.fromWei(balance, 'ether');
        document.getElementById('stakeAmount').value = ethBalance;
    } catch (error) {
        console.error('Error setting max:', error);
    }
}

// Set max unstake amount
async function setMaxUnstake() {
    try {
        const userStake = await stakingContract.methods.getUserStake(currentAccount).call();
        const ethBalance = web3.utils.fromWei(userStake.stakedAmount, 'ether');
        document.getElementById('unstakeAmount').value = ethBalance;
    } catch (error) {
        console.error('Error setting max:', error);
    }
}

// Utility functions
function updateUIState(isConnected) {
    if (isConnected) {
        document.getElementById('notConnectedState').style.display = 'none';
        document.getElementById('connectedState').style.display = 'block';

        // Update wallet button
        const btn = document.getElementById('connectWallet');
        btn.innerHTML = `
            <span class="wallet-icon">✅</span>
            <span class="wallet-text">${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}</span>
        `;
    } else {
        document.getElementById('notConnectedState').style.display = 'block';
        document.getElementById('connectedState').style.display = 'none';

        // Update wallet button
        const btn = document.getElementById('connectWallet');
        btn.innerHTML = `
            <span class="wallet-icon">🔒</span>
            <span class="wallet-text">Connect Wallet</span>
        `;
    }
}

function formatTokenAmount(wei) {
    if (!wei) return '0.00';
    try {
        const eth = web3.utils.fromWei(wei.toString(), 'ether');
        return parseFloat(eth).toFixed(2);
    } catch (error) {
        return '0.00';
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${capitalizeFirst(type)}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function setupEventListeners() {
    // Event listeners are set up in HTML onclick attributes
    // Additional listeners can be added here if needed
}
