/**
 * Calculate estimated rewards locally without blockchain calls
 * This provides instant UI updates while periodic blockchain calls verify accuracy
 */

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export function calculateLocalRewards(stakedAmount, stakedTimestamp, apyBasisPoints) {
    if (!stakedAmount || stakedAmount === '0' || !stakedTimestamp || stakedTimestamp === '0') {
        return '0';
    }

    const now = Math.floor(Date.now() / 1000);
    const timeStaked = now - parseInt(stakedTimestamp);

    if (timeStaked <= 0) return '0';

    // Convert from wei to tokens for calculation
    const stakedTokens = parseFloat(stakedAmount) / 1e18;
    const apy = parseInt(apyBasisPoints) / 10000; // Convert basis points to decimal (10000 = 1000%)

    // Reward = (stakedAmount * APY * timeStaked) / secondsPerYear
    const rewards = (stakedTokens * apy * timeStaked) / SECONDS_PER_YEAR;

    return rewards.toFixed(6);
}

export function formatTokenAmount(weiAmount) {
    if (!weiAmount) return '0.00';
    const tokens = parseFloat(weiAmount) / 1e18;
    return tokens.toFixed(4);
}

export function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

export function getExplorerUrl(txHash, network = 'sepolia') {
    const explorers = {
        sepolia: 'https://sepolia.etherscan.io/tx/',
        mainnet: 'https://etherscan.io/tx/'
    };
    return `${explorers[network] || explorers.sepolia}${txHash}`;
}
