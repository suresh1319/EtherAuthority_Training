import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { apiService } from '../services/api';
import { formatDate, getExplorerUrl, capitalizeFirst } from '../services/utils';

export default function TransactionHistory() {
    const { account } = useWeb3();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (account) {
            loadTransactions();
        }
    }, [account]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await apiService.getUserHistory(account);

            if (data.history && data.history.length > 0) {
                setTransactions(data.history);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (tx) => {
        if (tx.action === 'claim') {
            return (Number(tx.rewardAmount) / 1e18).toFixed(2);
        }
        return (Number(tx.amount) / 1e18).toFixed(2);
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <h3>Transaction History</h3>
                <button className="btn btn-sm" onClick={loadTransactions} disabled={loading}>
                    {loading ? '⏳' : '🔄'} Refresh
                </button>
            </div>
            <div className="panel-body">
                <div className="transaction-list">
                    {transactions.length === 0 ? (
                        <div className="empty-state-small">
                            <div className="empty-state-icon-small">📝</div>
                            <p>No transactions yet</p>
                        </div>
                    ) : (
                        transactions.map((tx, index) => (
                            <div key={index} className="transaction-item">
                                <div className="transaction-info">
                                    <div className={`transaction-action ${tx.action}`}>
                                        {capitalizeFirst(tx.action)}
                                    </div>
                                    <div className="transaction-meta">
                                        {formatDate(tx.timestamp)}
                                    </div>
                                    <div className="transaction-hash">
                                        <a
                                            href={getExplorerUrl(tx.transactionHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {tx.transactionHash.substring(0, 10)}...
                                            {tx.transactionHash.substring(tx.transactionHash.length - 8)}
                                        </a>
                                    </div>
                                </div>
                                <div className="transaction-amount">
                                    {formatAmount(tx)} STK
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
