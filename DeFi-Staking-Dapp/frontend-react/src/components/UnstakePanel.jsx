import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import './UnstakePanel.css';

const UnstakePanel = ({ onUnstakeSuccess }) => {
    const { contracts, account, isConnected } = useWeb3();
    const [stakeInfo, setStakeInfo] = useState(null);
    const [isUnstaking, setIsUnstaking] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && contracts.staking && account) {
            fetchAggregatedStakeInfo();
        }
    }, [isConnected, contracts, account]);

    const fetchAggregatedStakeInfo = async () => {
        try {
            setLoading(true);

            // Get all stakes for the user
            const stakesData = await contracts.staking.getAllUserStakes(account);

            let totalAmount = BigInt(0);
            let totalUnlockable = BigInt(0);
            let totalLocked = BigInt(0);
            let totalSTKRewards = BigInt(0);
            let totalGOVRewards = BigInt(0);
            let earliestUnlockTime = 0;
            let hasLockedStakes = false;
            const unlockableStakeIds = [];

            const currentTime = Math.floor(Date.now() / 1000);

            for (let i = 0; i < stakesData.amounts.length; i++) {
                if (stakesData.actives[i]) {
                    const amount = stakesData.amounts[i];
                    const unlockTime = Number(stakesData.unlockTimes[i]);
                    const isUnlocked = currentTime >= unlockTime;

                    totalAmount += amount;
                    totalSTKRewards += stakesData.stkRewards[i];
                    totalGOVRewards += stakesData.govRewards[i];

                    if (isUnlocked) {
                        totalUnlockable += amount;
                        unlockableStakeIds.push(i);
                    } else {
                        totalLocked += amount;
                        hasLockedStakes = true;
                        if (earliestUnlockTime === 0 || unlockTime < earliestUnlockTime) {
                            earliestUnlockTime = unlockTime;
                        }
                    }
                }
            }

            setStakeInfo({
                totalAmount: ethers.formatUnits(totalAmount, 18),
                unlockableAmount: ethers.formatUnits(totalUnlockable, 18),
                lockedAmount: ethers.formatUnits(totalLocked, 18),
                stkRewards: ethers.formatUnits(totalSTKRewards, 18),
                govRewards: ethers.formatUnits(totalGOVRewards, 18),
                hasLockedStakes,
                earliestUnlockTime,
                unlockableStakeIds
            });
        } catch (error) {
            console.error('Error fetching stake info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnstakeAll = async () => {
        try {
            setIsUnstaking(true);
            setMessage(null);

            // Unstake all unlockable stakes
            for (const stakeId of stakeInfo.unlockableStakeIds) {
                const tx = await contracts.staking.unstake(stakeId, 0); // 0 means unstake all
                await tx.wait();
            }

            setMessage({ type: 'success', text: 'Successfully unstaked all unlocked stakes!' });

            if (onUnstakeSuccess) {
                onUnstakeSuccess();
            }

            setTimeout(() => {
                setMessage(null);
                fetchAggregatedStakeInfo();
            }, 3000);
        } catch (error) {
            console.error('Unstaking error:', error);
            setMessage({
                type: 'error',
                text: error.reason || error.message || 'Unstaking failed'
            });
        } finally {
            setIsUnstaking(false);
        }
    };

    const handleClaimRewards = async () => {
        try {
            setIsClaiming(true);
            setMessage(null);

            // Claim rewards from all stakes
            const tx = await contracts.staking.claimAllRewards();
            await tx.wait();

            setMessage({ type: 'success', text: 'Rewards claimed successfully!' });

            setTimeout(() => {
                setMessage(null);
                fetchAggregatedStakeInfo();
            }, 3000);
        } catch (error) {
            console.error('Claiming error:', error);
            setMessage({
                type: 'error',
                text: error.reason || error.message || 'Claim failed'
            });
        } finally {
            setIsClaiming(false);
        }
    };

    const getTimeRemaining = () => {
        if (!stakeInfo || !stakeInfo.hasLockedStakes) return null;

        const currentTime = Math.floor(Date.now() / 1000);
        const remaining = stakeInfo.earliestUnlockTime - currentTime;

        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        return `${days}d ${hours}h ${minutes}m`;
    };

    const formatNumber = (num) => {
        const parsed = parseFloat(num);
        return parsed.toFixed(4);
    };

    if (!isConnected) {
        return null;
    }

    if (loading) {
        return (
            <div className="card unstake-panel">
                <div className="loading-state">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!stakeInfo || parseFloat(stakeInfo.totalAmount) === 0) {
        return (
            <div className="card unstake-panel">
                <div className="card-header">
                    <h3>🎁 Your Stake</h3>
                </div>
                <div className="no-stake-message">
                    <p>💤 No active stake found</p>
                    <p className="subtitle">Stake tokens to start earning rewards!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card unstake-panel fade-in">
            <div className="card-header">
                <h3>🎁 Your Stake</h3>
            </div>

            <div className="stake-overview">
                <div className="overview-item">
                    <span className="overview-label">Total Staked</span>
                    <span className="overview-value">{formatNumber(stakeInfo.totalAmount)} STK</span>
                </div>
                <div className="overview-item">
                    <span className="overview-label">Unlockable Now</span>
                    <span className="overview-value text-success">{formatNumber(stakeInfo.unlockableAmount)} STK</span>
                </div>
                {stakeInfo.hasLockedStakes && (
                    <div className="overview-item">
                        <span className="overview-label">Locked</span>
                        <span className="overview-value text-warning">{formatNumber(stakeInfo.lockedAmount)} STK</span>
                    </div>
                )}
            </div>

            <div className="rewards-section">
                <h4 className="section-title">Pending Rewards</h4>
                <div className="rewards-grid">
                    <div className="reward-item">
                        <span className="reward-label">STK Rewards</span>
                        <span className="reward-value">{formatNumber(stakeInfo.stkRewards)}</span>
                    </div>
                    <div className="reward-item">
                        <span className="reward-label">GOV Rewards</span>
                        <span className="reward-value">{formatNumber(stakeInfo.govRewards)}</span>
                    </div>
                </div>
            </div>

            {stakeInfo.hasLockedStakes && (
                <div className="lock-warning">
                    <span className="warning-icon">⏳</span>
                    <div>
                        <strong>Locked Stakes</strong>
                        <p>Earliest unlock in: {getTimeRemaining()}</p>
                    </div>
                </div>
            )}

            {message && (
                <div className={`message message-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="action-buttons">
                <button
                    className="btn btn-success btn-half"
                    onClick={handleClaimRewards}
                    disabled={isClaiming || parseFloat(stakeInfo.stkRewards) === 0}
                >
                    {isClaiming ? (
                        <>
                            <div className="spinner-small"></div>
                            Claiming...
                        </>
                    ) : (
                        <>
                            <span>💎</span>
                            Claim Rewards
                        </>
                    )}
                </button>

                <button
                    className="btn btn-secondary btn-half"
                    onClick={handleUnstakeAll}
                    disabled={isUnstaking || parseFloat(stakeInfo.unlockableAmount) === 0}
                >
                    {isUnstaking ? (
                        <>
                            <div className="spinner-small"></div>
                            Unstaking...
                        </>
                    ) : (
                        <>
                            <span>🔓</span>
                            Unstake All
                        </>
                    )}
                </button>
            </div>

            {parseFloat(stakeInfo.unlockableAmount) === 0 && stakeInfo.hasLockedStakes && (
                <p className="help-text">
                    All your stakes are locked. Wait for the lock period to end to unstake.
                </p>
            )}
        </div>
    );
};

export default UnstakePanel;
