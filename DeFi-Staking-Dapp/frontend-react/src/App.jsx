import { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import StakingPanel from './components/StakingPanel';
import UnstakePanel from './components/UnstakePanel';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Web3Provider>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <div className="logo-section">
                <h1 className="app-title">
                  <span className="logo-icon">🌟</span>
                  DeFi Staking
                </h1>
                <p className="app-subtitle">Earn rewards with multi-tier time-locked staking</p>
              </div>
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <Dashboard key={`dashboard-${refreshKey}`} />

            <div className="panels-grid">
              <StakingPanel onStakeSuccess={handleRefresh} />
              <UnstakePanel onUnstakeSuccess={handleRefresh} />
            </div>

            <TransactionHistory key={`history-${refreshKey}`} />

            <div className="info-section card fade-in">
              <h3>ℹ️ About This DApp</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>🔒 Time-Locked Tiers</strong>
                  <p>Choose from Flexible, 30, 60, or 90-day lock periods for higher rewards</p>
                </div>
                <div className="info-item">
                  <strong>💎 Dual Rewards</strong>
                  <p>Earn STK tokens + 10% bonus in GOV tokens</p>
                </div>
                <div className="info-item">
                  <strong>📈 Dynamic APY</strong>
                  <p>APY adjusts based on Total Value Locked (TVL)</p>
                </div>
                <div className="info-item">
                  <strong>🔄 Auto-Compound</strong>
                  <p>Optional automatic reward reinvestment every 7 days</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>Built for EtherAuthority Training - Week 3 | Sepolia Testnet</p>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}

export default App;
