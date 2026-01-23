import { useWeb3 } from '../context/Web3Context';
import './WalletConnect.css';

const WalletConnect = () => {
    const { account, isConnecting, connectWallet, disconnectWallet, isConnected, error } = useWeb3();

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="wallet-connect">
            {!isConnected ? (
                <button
                    className="btn btn-primary"
                    onClick={connectWallet}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <div className="spinner-small"></div>
                            Connecting...
                        </>
                    ) : (
                        <>
                            <span>🔌</span>
                            Connect Wallet
                        </>
                    )}
                </button>
            ) : (
                <div className="wallet-info">
                    <div className="wallet-address">
                        <span className="wallet-icon">✅</span>
                        <span className="address-text">{formatAddress(account)}</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={disconnectWallet}>
                        Disconnect
                    </button>
                </div>
            )}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default WalletConnect;
