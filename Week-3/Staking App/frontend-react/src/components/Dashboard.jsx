import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { apiService } from '../services/api';
import { formatTokenAmount } from '../services/utils';

export default function Dashboard() {
    const { account, stakingContract, tokenContract } = useWeb3();
    const [stats, setStats] = useState({
        totalStaked: '0.00',
        userStaked: '0.00',
        pendingRewards: '0.00',
        apy: '10.00'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (account && stakingContract && tokenContract) {
            loadStats();
            const interval = setInterval(loadStats, 10000); // Update every 10 seconds
            return () => clearInterval(interval);
        }
    }, [account, stakingContract, tokenContract]);

    const loadStats = async () => {
        if (!stakingContract || !account) return;

        try {
            setLoading(true);

            // Get total staked
            const totalStaked = await stakingContract.methods.getTotalStaked().call();

            // Get user stake info
            const userStake = await stakingContract.methods.getUserStake(account).call();

            // Calculate pending rewards
            const pendingRewards = await stakingContract.methods.calculateRewards(account).call();

            // Get actual APY from contract
            const apyBasisPoints = await stakingContract.methods.getAPY().call();
            const apyPercentage = (Number(apyBasisPoints) / 100).toFixed(2); // Convert basis points to percentage

            setStats({
                totalStaked: formatTokenAmount(totalStaked),
                userStaked: formatTokenAmount(userStake.stakedAmount),
                pendingRewards: formatTokenAmount(pendingRewards),
                apy: apyPercentage
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (account && stakingContract) {
            const interval = setInterval(async () => {
                const rewards = await stakingContract.methods
                    .calculateRewards(account)
                    .call();
                console.log("Current Rewards:", formatTokenAmount(rewards), "STK");
            }, 5000); // Log every 5 seconds

            return () => clearInterval(interval);
        }
    }, [account, stakingContract]);


    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                    <div className="stat-label">Total Value Locked</div>
                    <div className="stat-value">{stats.totalStaked} STK</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                    <div className="stat-label">Your Staked Amount</div>
                    <div className="stat-value">{stats.userStaked} STK</div>
                </div>
            </div>

            <div className="stat-card gradient-card">
                <div className="stat-icon">✨</div>
                <div className="stat-content">
                    <div className="stat-label">Pending Rewards</div>
                    <div className="stat-value">{stats.pendingRewards} STK</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                    <div className="stat-label">Current APY</div>
                    <div className="stat-value">{stats.apy}%</div>
                </div>
            </div>
        </div>
    );
}
