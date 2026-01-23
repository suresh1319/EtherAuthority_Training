import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import apiService from '../services/api';
import './TransactionHistory.css';

const TransactionHistory = () => {
    const { account, isConnected } = useWeb3();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [backendOnline, setBackendOnline] = useState(false);

    useEffect(() => {
        checkBackendHealth();
    }, []);

    useEffect(() => {
        if (isConnected && account && backendOnline) {
            fetchTransactions();
        }
    }, [isConnected, account, backendOnline]);

    const checkBackendHealth = async () => {
        try {
            const health = await apiService.checkHealth();
            setBackendOnline(health.status === 'ok');
        } catch (error) {
            setBackendOnline(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getTransactions(account);

            if (response.success) {
                setTransactions(response.data);
            }
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        return num.toFixed(4);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'STAKE':
                return '🔒';
            case 'UNSTAKE':
                return '🔓';
            case 'CLAIM_REWARDS':
                return '💎';
            case 'AUTO_COMPOUND':
                return '🔄';
            default:
                return '📝';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'STAKE':
                return 'type-stake';
            case 'UNSTAKE':
                return 'type-unstake';
            case 'CLAIM_REWARDS':
                return 'type-claim';
            case 'AUTO_COMPOUND':
                return 'type-compound';
            default:
                return '';
        }
    };

    const getLockPeriodName = (period) => {
        const periods = ['Flexible', '30 Days', '60 Days', '90 Days'];
        return periods[period] || 'Unknown';
    };

    const viewOnExplorer = (txHash) => {
        window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
    };

    if (!isConnected) {
        return null;
    }

    if (!backendOnline) {
        return (
            <div className="card transaction-history">
                <div className="card-header">
                    <h3>📜 Transaction History</h3>
                </div>
                <div className="no-backend-message">
                    <p>🔌 Backend server is offline</p>
                    <p className="subtitle">Start the backend server to view transaction history</p>
                    <code className="command">cd backend && npm run dev</code>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card transaction-history">
                <div className="card-header">
                    <h3>📜 Transaction History</h3>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card transaction-history">
                <div className="card-header">
                    <h3>📜 Transaction History</h3>
                </div>
                <div className="error-state">
                    <p>❌ {error}</p>
                    <button className="btn btn-secondary btn-sm" onClick={fetchTransactions}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card transaction-history fade-in">
            <div className="card-header">
                <h3>📜 Transaction History</h3>
                <button className="btn btn-secondary btn-sm" onClick={fetchTransactions}>
                    🔄 Refresh
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="no-transactions">
                    <p>📭 No transactions yet</p>
                    <p className="subtitle">Your staking activity will appear here</p>
                </div>
            ) : (
                <div className="transactions-list">
                    {transactions.map((tx) => (
                        <div key={tx._id} className="transaction-item">
                            <div className="tx-icon">
                                {getTypeIcon(tx.type)}
                            </div>

                            <div className="tx-details">
                                <div className="tx-header">
                                    <span className={`tx-type ${getTypeColor(tx.type)}`}>
                                        {tx.type.replace('_', ' ')}
                                    </span>
                                    <span className="tx-date">{formatDate(tx.timestamp)}</span>
                                </div>

                                <div className="tx-amounts">
                                    {parseFloat(tx.amount) > 0 && (
                                        <div className="amount-item">
                                            <span className="amount-label">Amount:</span>
                                            <span className="amount-value">{formatAmount(tx.amount)} STK</span>
                                        </div>
                                    )}

                                    {parseFloat(tx.stkRewards || 0) > 0 && (
                                        <div className="amount-item">
                                            <span className="amount-label">STK Rewards:</span>
                                            <span className="amount-value reward">{formatAmount(tx.stkRewards)}</span>
                                        </div>
                                    )}

                                    {parseFloat(tx.govRewards || 0) > 0 && (
                                        <div className="amount-item">
                                            <span className="amount-label">GOV Rewards:</span>
                                            <span className="amount-value reward">{formatAmount(tx.govRewards)}</span>
                                        </div>
                                    )}
                                </div>

                                {tx.lockPeriod !== undefined && tx.type === 'STAKE' && (
                                    <div className="tx-meta">
                                        <span className="badge badge-info">
                                            {getLockPeriodName(tx.lockPeriod)}
                                        </span>
                                        {tx.autoCompound && (
                                            <span className="badge badge-success">Auto-Compound</span>
                                        )}
                                    </div>
                                )}

                                <button
                                    className="tx-hash-link"
                                    onClick={() => viewOnExplorer(tx.txHash)}
                                    title="View on Etherscan"
                                >
                                    🔗 View on Explorer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
