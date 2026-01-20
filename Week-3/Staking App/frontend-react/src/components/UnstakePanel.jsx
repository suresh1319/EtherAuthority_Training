import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { apiService } from '../services/api';
import { formatTokenAmount, calculateLocalRewards } from '../services/utils';

export default function UnstakePanel() {
    const { account, stakingContract } = useWeb3();
    const [amount, setAmount] = useState('');
    const [userStakedAmount, setUserStakedAmount] = useState('0');
    const [pendingRewards, setPendingRewards] = useState('0');
    const [stakedTimestamp, setStakedTimestamp] = useState('0');
    const [apyBasisPoints, setApyBasisPoints] = useState('10000');
    const [loading, setLoading] = useState(false);

    // Load from blockchain every 10 seconds
    useEffect(() => {
        if (account && stakingContract) {
            loadUserStake();
            const interval = setInterval(loadUserStake, 10000);
            return () => clearInterval(interval);
        }
    }, [account, stakingContract]);

    // Calculate rewards locally every 1 second for smooth updates
    useEffect(() => {
        if (userStakedAmount !== '0' && stakedTimestamp !== '0') {
            const interval = setInterval(() => {
                const localRewards = calculateLocalRewards(
                    BigInt(parseFloat(userStakedAmount) * 1e18).toString(),
                    stakedTimestamp,
                    apyBasisPoints
                );
                setPendingRewards(localRewards);
            }, 1000); // Update every second for real-time feel
            return () => clearInterval(interval);
        }
    }, [userStakedAmount, stakedTimestamp, apyBasisPoints]);

    const loadUserStake = async () => {
        try {
            const [userStake, apy] = await Promise.all([
                stakingContract.methods.getUserStake(account).call(),
                stakingContract.methods.getAPY().call()
            ]);

            setUserStakedAmount(formatTokenAmount(userStake.stakedAmount));
            setStakedTimestamp(userStake.stakedTimestamp.toString());
            setApyBasisPoints(apy.toString());

            // Also get blockchain rewards for accuracy check
            const blockchainRewards = await stakingContract.methods.calculateRewards(account).call();
            setPendingRewards(formatTokenAmount(blockchainRewards));
        } catch (error) {
            console.error('Error loading user stake:', error);
        }
    };

    const handleUnstake = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const weiAmount = BigInt(parseFloat(amount) * 1e18).toString();

            const tx = await stakingContract.methods.unstake(weiAmount)
                .send({ from: account });

            // Record transaction
            await apiService.recordUnstake({
                userAddress: account,
                amount: weiAmount.toString(),
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            });

            alert('✅ Tokens unstaked successfully!');
            setAmount('');
            await loadUserStake();
        } catch (error) {
            console.error('Error unstaking:', error);
            alert('❌ Unstaking failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimRewards = async () => {
        try {
            setLoading(true);

            const tx = await stakingContract.methods.claimRewards()
                .send({ from: account });

            // Record transaction
            const rewardWei = BigInt(parseFloat(pendingRewards) * 1e18).toString();
            await apiService.recordClaim({
                userAddress: account,
                rewardAmount: rewardWei,
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            });

            alert('✅ Rewards claimed successfully!');
            await loadUserStake();
        } catch (error) {
            console.error('Error claiming rewards:', error);
            alert('❌ Claim failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const setMaxAmount = () => {
        setAmount(userStakedAmount);
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <h3>🎁 Rewards & Unstake</h3>
            </div>
            <div className="panel-body">
                <div className="rewards-display">
                    <div className="reward-card">
                        <span>Pending Rewards</span>
                        <strong className="reward-value">{pendingRewards} STK</strong>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleClaimRewards}
                            disabled={loading || parseFloat(pendingRewards) === 0}
                        >
                            {loading ? '⏳ Claiming...' : '🎁 Claim Rewards'}
                        </button>
                    </div>
                </div>

                <div className="divider"></div>

                <div className="balance-display">
                    <span>Staked Amount:</span>
                    <strong>{userStakedAmount} STK</strong>
                </div>

                <div className="input-group">
                    <input
                        type="number"
                        placeholder="Enter amount to unstake"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={loading}
                    />
                    <button className="btn btn-sm" onClick={setMaxAmount} disabled={loading}>
                        MAX
                    </button>
                </div>

                <button
                    className="btn btn-secondary btn-block"
                    onClick={handleUnstake}
                    disabled={loading || !amount}
                >
                    {loading ? '⏳ Processing...' : '📤 Unstake'}
                </button>

                <div className="info-text">
                    <p>• Claim rewards anytime without unstaking</p>
                    <p>• No fees or penalties for unstaking</p>
                </div>
            </div>
        </div>
    );
}
