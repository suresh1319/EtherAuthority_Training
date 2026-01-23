import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { LOCK_PERIODS } from '../contracts/config';
import './StakingPanel.css';

const StakingPanel = ({ onStakeSuccess }) => {
    const { contracts, account, isConnected } = useWeb3();
    const [amount, setAmount] = useState('');
    const [selectedTier, setSelectedTier] = useState(LOCK_PERIODS.FLEXIBLE.value);
    const [autoCompound, setAutoCompound] = useState(false);
    const [isStaking, setIsStaking] = useState(false);
    const [message, setMessage] = useState(null);

    const handleStake = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        try {
            setIsStaking(true);
            setMessage(null);

            const amountWei = ethers.parseUnits(amount, 18);

            // First, approve the staking contract to spend tokens
            setMessage({ type: 'info', text: 'Approving tokens...' });
            const approveTx = await contracts.stkToken.approve(
                contracts.staking.target,
                amountWei
            );
            await approveTx.wait();

            // Then stake
            setMessage({ type: 'info', text: 'Staking tokens...' });
            const stakeTx = await contracts.staking.stake(
                amountWei,
                selectedTier,
                false, // isLP
                autoCompound
            );
            await stakeTx.wait();

            setMessage({ type: 'success', text: `Successfully staked ${amount} STK!` });
            setAmount('');

            if (onStakeSuccess) {
                onStakeSuccess();
            }

            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            console.error('Staking error:', error);
            setMessage({
                type: 'error',
                text: error.reason || error.message || 'Staking failed. Please try again.'
            });
        } finally {
            setIsStaking(false);
        }
    };

    const getTierDetails = () => {
        return Object.values(LOCK_PERIODS).find(tier => tier.value === selectedTier);
    };

    if (!isConnected) {
        return null;
    }

    const tierDetails = getTierDetails();

    return (
        <div className="card staking-panel fade-in">
            <div className="card-header">
                <h3>🚀 Stake Tokens</h3>
                <span className="badge badge-info">STK Token</span>
            </div>

            <div className="input-group">
                <label className="input-label">Amount to Stake</label>
                <input
                    type="number"
                    className="input"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isStaking}
                />
            </div>

            <div className="input-group">
                <label className="input-label">Select Lock Period</label>
                <div className="tier-grid">
                    {Object.values(LOCK_PERIODS).map((tier) => (
                        <div
                            key={tier.value}
                            className={`tier-card ${selectedTier === tier.value ? 'active' : ''}`}
                            onClick={() => setSelectedTier(tier.value)}
                        >
                            <div className="tier-name">{tier.name}</div>
                            <div className="tier-multiplier">{tier.multiplier}</div>
                            <div className="tier-apy">APY: {tier.apy}</div>
                            <div className="tier-duration">{tier.duration}</div>
                        </div>
                    ))}
                </div>
            </div>

            {tierDetails && (
                <div className="selected-tier-info">
                    <div className="info-item">
                        <span>Selected Tier:</span>
                        <strong>{tierDetails.name}</strong>
                    </div>
                    <div className="info-item">
                        <span>APY:</span>
                        <strong className="text-accent">{tierDetails.apy}</strong>
                    </div>
                    <div className="info-item">
                        <span>Multiplier:</span>
                        <strong>{tierDetails.multiplier}</strong>
                    </div>
                </div>
            )}

            <div className="checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={autoCompound}
                        onChange={(e) => setAutoCompound(e.target.checked)}
                        disabled={isStaking}
                    />
                    <span>Enable Auto-Compound (Maximizes returns)</span>
                </label>
            </div>

            {message && (
                <div className={`message message-${message.type}`}>
                    {message.text}
                </div>
            )}

            <button
                className="btn btn-primary btn-full"
                onClick={handleStake}
                disabled={isStaking || !amount}
            >
                {isStaking ? (
                    <>
                        <div className="spinner-small"></div>
                        Processing...
                    </>
                ) : (
                    <>
                        <span>🔒</span>
                        Stake Tokens
                    </>
                )}
            </button>
        </div>
    );
};

export default StakingPanel;
