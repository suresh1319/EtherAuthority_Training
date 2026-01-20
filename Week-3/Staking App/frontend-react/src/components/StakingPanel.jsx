import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { apiService } from '../services/api';
import { formatTokenAmount } from '../services/utils';

export default function StakingPanel() {
    const { account, web3, tokenContract, stakingContract, contractAddresses } = useWeb3();
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('0');
    const [allowance, setAllowance] = useState('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (account && tokenContract) {
            loadBalance();
            loadAllowance();
        }
    }, [account, tokenContract]);

    const loadBalance = async () => {
        try {
            const bal = await tokenContract.methods.balanceOf(account).call();
            setBalance(formatTokenAmount(bal));
        } catch (error) {
            console.error('Error loading balance:', error);
        }
    };

    const loadAllowance = async () => {
        try {
            const allow = await tokenContract.methods.allowance(account, contractAddresses.StakingContract).call();
            setAllowance(allow.toString());
        } catch (error) {
            console.error('Error loading allowance:', error);
        }
    };

    const handleApprove = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const weiAmount = web3.utils.toWei(amount, 'ether');

            await tokenContract.methods.approve(contractAddresses.StakingContract, weiAmount)
                .send({ from: account });

            alert('✅ Tokens approved successfully!');
            await loadAllowance();
        } catch (error) {
            console.error('Error approving:', error);
            alert('❌ Approval failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStake = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const weiAmount = web3.utils.toWei(amount, 'ether');

            // Check allowance
            if (BigInt(allowance) < BigInt(weiAmount)) {
                alert('Please approve tokens first');
                return;
            }

            const tx = await stakingContract.methods.stake(weiAmount)
                .send({ from: account });

            // Record transaction
            await apiService.recordStake({
                userAddress: account,
                amount: weiAmount.toString(),
                transactionHash: tx.transactionHash,
                blockNumber: Number(tx.blockNumber)
            });

            alert('✅ Tokens staked successfully!');
            setAmount('');
            await loadBalance();
            await loadAllowance();
        } catch (error) {
            console.error('Error staking:', error);
            alert('❌ Staking failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const setMaxAmount = () => {
        setAmount(balance);
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <h3>💎 Stake Tokens</h3>
            </div>
            <div className="panel-body">
                <div className="balance-display">
                    <span>Available Balance:</span>
                    <strong>{balance} STK</strong>
                </div>

                <div className="input-group">
                    <input
                        type="number"
                        placeholder="Enter amount to stake"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={loading}
                    />
                    <button className="btn btn-sm" onClick={setMaxAmount} disabled={loading}>
                        MAX
                    </button>
                </div>

                <div className="button-group">
                    <button
                        className="btn btn-secondary"
                        onClick={handleApprove}
                        disabled={loading || !amount}
                    >
                        {loading ? '⏳ Processing...' : '✓ Approve'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleStake}
                        disabled={loading || !amount}
                    >
                        {loading ? '⏳ Processing...' : '💎 Stake'}
                    </button>
                </div>

                <div className="info-text">
                    <p>• Approve tokens before staking</p>
                    <p>• Earn 10% APY on staked tokens</p>
                    <p>• No lock period, unstake anytime</p>
                </div>
            </div>
        </div>
    );
}
