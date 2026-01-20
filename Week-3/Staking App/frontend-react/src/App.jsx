import React from 'react';
import { useWeb3 } from './context/Web3Context';
import { useToast } from './hooks/useToast';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StakingPanel from './components/StakingPanel';
import UnstakePanel from './components/UnstakePanel';
import TransactionHistory from './components/TransactionHistory';
import Toast from './components/Toast';
import './index.css';

export const ToastContext = React.createContext();

function App() {
    const { account } = useWeb3();
    const { toasts, showToast, removeToast } = useToast();

    return (
        <ToastContext.Provider value={{ showToast }}>
            <div className="app">
                <Header />

                <main className="main">
                    <div className="container">
                        {/* Hero Section */}
                        <section className="hero">
                            <h1 className="hero-title">
                                Stake & Earn <span className="gradient-text">10% APY</span>
                            </h1>
                            <p className="hero-subtitle">
                                Stake your tokens and watch your rewards grow automatically
                            </p>
                        </section>

                        {/* Not Connected State */}
                        {!account ? (
                            <div className="not-connected">
                                <div className="empty-state">
                                    <div className="empty-state-icon">🔐</div>
                                    <h3>Connect Your Wallet</h3>
                                    <p>Connect your MetaMask wallet to start staking and earning rewards</p>
                                </div>
                            </div>
                        ) : (
                            <div className="connected-state">
                                {/* Dashboard Stats */}
                                <Dashboard />

                                {/* Action Panels */}
                                <div className="action-section">
                                    <StakingPanel />
                                    <UnstakePanel />
                                </div>

                                {/* Transaction History */}
                                <TransactionHistory />
                            </div>
                        )}
                    </div>
                </main>

                {/* Toast Container */}
                <div className="toast-container">
                    {toasts.map(toast => (
                        <Toast key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </div>

                {/* Loading Overlay */}
                <div id="loadingOverlay" className="loading-overlay" style={{ display: 'none' }}>
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Processing transaction...</div>
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export default App;
