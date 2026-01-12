import { useState } from 'react';
import { Link } from 'react-router-dom';
import { web3Service } from '../../services/web3';

function Header({ walletAddress, setWalletAddress }) {
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);

    const handleConnectWallet = async () => {
        setConnecting(true);
        setError(null);

        try {
            const { address } = await web3Service.connectWallet();
            setWalletAddress(address);
        } catch (err) {
            setError(err.message);
            console.error('Wallet connection error:', err);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        web3Service.disconnect();
        setWalletAddress(null);
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    🎓 Internship Reward
                </Link>

                <nav className="nav">
                    <Link to="/" className="nav-link">Dashboard</Link>
                    <Link to="/register" className="nav-link">Register</Link>
                    <Link to="/tasks" className="nav-link">Tasks</Link>
                    <Link to="/nfts" className="nav-link">NFT Gallery</Link>
                    <Link to="/profile" className="nav-link">Profile</Link>

                    {walletAddress ? (
                        <div className="flex items-center gap-md">
                            <div className="wallet-address">
                                {web3Service.formatAddress(walletAddress)}
                            </div>
                            <button onClick={handleDisconnect} className="btn btn-secondary btn-sm">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnectWallet}
                            className="wallet-button"
                            disabled={connecting}
                        >
                            {connecting ? 'Connecting...' : '🦊 Connect Wallet'}
                        </button>
                    )}
                </nav>
            </div>

            {error && (
                <div className="error-banner" style={{
                    background: 'var(--error)',
                    color: 'white',
                    padding: 'var(--spacing-sm)',
                    textAlign: 'center',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    {error}
                </div>
            )}
        </header>
    );
}

export default Header;
