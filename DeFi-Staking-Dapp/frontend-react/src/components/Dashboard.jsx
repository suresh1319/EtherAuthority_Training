import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import './Dashboard.css';

const Dashboard = () => {
    const { contracts, account, isConnected } = useWeb3();
    const [stats, setStats] = useState({
        tvl: '0',
        currentAPY: '0',
        yourStake: '0',
        pendingRewards: '0',
        stkBalance: '0',
        govBalance: '0',
        totalRewardsPaid: '0',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && contracts.staking) {
            fetchDashboardData();
            const interval = setInterval(fetchDashboardData, 10000); // Update every 10s
            return () => clearInterval(interval);
        }
    }, [isConnected, contracts, account]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch TVL and APY
            const tvl = await contracts.staking.getTVL();
            const currentAPY = await contracts.staking.getCurrentAPY();

            // Fetch user stake info
            let userStake = '0';
            let pendingSTK = '0';
            let pendingGOV = '0';

            if (account) {
                // V2 contract: getTotalUserStake returns total across all stakes
                userStake = await contracts.staking.getTotalUserStake(account);

                // For rewards, still use first stake (stakeId 0) for now
                // TODO: Sum rewards from all stakes
                const rewards = await contracts.staking.calculateRewards(account, 0);
                pendingSTK = rewards.stkRewards;
                pendingGOV = rewards.govRewards;
            }

            // Fetch token balances
            const stkBalance = account
                ? await contracts.stkToken.balanceOf(account)
                : '0';
            const govBalance = account
                ? await contracts.govToken.balanceOf(account)
                : '0';

            // Fetch total rewards paid
            const totalRewards = await contracts.staking.totalRewardsPaid();

            setStats({
                tvl: ethers.formatUnits(tvl, 18),
                currentAPY: currentAPY.toString(),
                yourStake: ethers.formatUnits(userStake, 18),
                pendingRewards: ethers.formatUnits(pendingSTK, 18),
                stkBalance: ethers.formatUnits(stkBalance, 18),
                govBalance: ethers.formatUnits(govBalance, 18),
                totalRewardsPaid: ethers.formatUnits(totalRewards, 18),
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        const parsed = parseFloat(num);
        if (parsed >= 1000000) return `${(parsed / 1000000).toFixed(2)}M`;
        if (parsed >= 1000) return `${(parsed / 1000).toFixed(2)}K`;
        return parsed.toFixed(2);
    };

    if (!isConnected) {
        return (
            <div className="dashboard-placeholder card">
                <h2>📊 Dashboard</h2>
                <p className="placeholder-text">Connect your wallet to view dashboard</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>📊 Dashboard</h2>
                <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
                    🔄 Refresh
                </button>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card fade-in">
                    <div className="stat-label">Total Value Locked</div>
                    <div className="stat-value">{formatNumber(stats.tvl)} STK</div>
                </div>

                <div className="stat-card fade-in">
                    <div className="stat-label">Current APY</div>
                    <div className="stat-value">{(parseFloat(stats.currentAPY) / 100).toFixed(1)}%</div>
                </div>

                <div className="stat-card fade-in">
                    <div className="stat-label">Your Stake</div>
                    <div className="stat-value">{formatNumber(stats.yourStake)} STK</div>
                </div>

                <div className="stat-card fade-in">
                    <div className="stat-label">Pending Rewards</div>
                    <div className="stat-value">{formatNumber(stats.pendingRewards)} STK</div>
                    <div className="stat-change positive">
                        +{formatNumber(stats.govBalance)} GOV
                    </div>
                </div>
            </div>

            <div className="balance-cards">
                <div className="card balance-card fade-in">
                    <div className="card-header">
                        <h3>💰 Wallet Balances</h3>
                    </div>
                    <div className="balance-item">
                        <span className="balance-label">STK Token</span>
                        <span className="balance-value">{formatNumber(stats.stkBalance)} STK</span>
                    </div>
                    <div className="balance-item">
                        <span className="balance-label">GOV Token</span>
                        <span className="balance-value">{formatNumber(stats.govBalance)} GOV</span>
                    </div>
                </div>

                <div className="card stats-card fade-in">
                    <div className="card-header">
                        <h3>📈 Protocol Stats</h3>
                    </div>
                    <div className="balance-item">
                        <span className="balance-label">Total Rewards Paid</span>
                        <span className="balance-value">{formatNumber(stats.totalRewardsPaid)} STK</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
