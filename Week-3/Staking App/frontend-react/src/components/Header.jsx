import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import NetworkBadge from './NetworkBadge';

export default function Header() {
    const { account, connectWallet, disconnectWallet, isConnecting } = useWeb3();
    const [showDropdown, setShowDropdown] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const copyAddress = async () => {
        if (account) {
            try {
                await navigator.clipboard.writeText(account);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    const switchAccount = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                });
                setShowDropdown(false);
            } catch (error) {
                console.error('Error switching account:', error);
            }
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        setShowDropdown(false);
    };

    return (
        <header className="header">
            <div className="container header-content">
                <div className="logo">
                    <div className="logo-icon">⚡</div>
                    <span className="logo-text">Staking Dapp</span>
                </div>

                <div className="header-actions">
                    {account && <NetworkBadge />}

                    {!account ? (
                        <button
                            onClick={connectWallet}
                            className="btn btn-primary"
                            disabled={isConnecting}
                        >
                            <span className="wallet-icon">🔒</span>
                            <span className="wallet-text">
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </span>
                        </button>
                    ) : (
                        <div className="wallet-container" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="btn btn-primary wallet-btn-connected"
                            >
                                <span className="wallet-icon">✅</span>
                                <span className="wallet-text">
                                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                                </span>
                                <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
                            </button>

                            {showDropdown && (
                                <div className="wallet-dropdown">
                                    {/* Full Address with Copy */}
                                    <div className="dropdown-item wallet-address-full">
                                        <div className="address-display">
                                            <span className="address-label">Address:</span>
                                            <span className="address-value" title={account}>
                                                {account}
                                            </span>
                                        </div>
                                        <button
                                            onClick={copyAddress}
                                            className="copy-btn"
                                            title="Copy address"
                                        >
                                            {copySuccess ? '✓' : '📋'}
                                        </button>
                                    </div>

                                    {copySuccess && (
                                        <div className="copy-success-message">
                                            ✓ Address copied to clipboard!
                                        </div>
                                    )}

                                    <div className="dropdown-divider"></div>

                                    {/* Switch Account */}
                                    <button
                                        onClick={switchAccount}
                                        className="dropdown-item dropdown-btn"
                                    >
                                        <span className="dropdown-icon">🔄</span>
                                        Switch Account
                                    </button>

                                    {/* Disconnect */}
                                    <button
                                        onClick={handleDisconnect}
                                        className="dropdown-item dropdown-btn disconnect-btn"
                                    >
                                        <span className="dropdown-icon">🚪</span>
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
