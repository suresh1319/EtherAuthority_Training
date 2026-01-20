import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const NETWORKS = {
    '0xaa36a7': { name: 'Sepolia', icon: '🌐', color: 'success' },
    '0x1': { name: 'Ethereum', icon: '⚠️', color: 'warning' },
    '0x89': { name: 'Polygon', icon: '⚠️', color: 'warning' },
    '0x38': { name: 'BSC', icon: '⚠️', color: 'warning' }
};

export default function NetworkBadge() {
    const { currentNetwork, isCorrectNetwork, switchToSepolia } = useWeb3();

    if (!currentNetwork) return null;

    const network = NETWORKS[currentNetwork] || {
        name: 'Unknown',
        icon: '❓',
        color: 'error'
    };

    const handleClick = () => {
        if (!isCorrectNetwork) {
            switchToSepolia();
        }
    };

    return (
        <div
            className={`network-badge ${isCorrectNetwork ? 'correct' : 'wrong'}`}
            onClick={handleClick}
            style={{ cursor: isCorrectNetwork ? 'default' : 'pointer' }}
            title={isCorrectNetwork ? 'Connected to Sepolia' : 'Click to switch to Sepolia'}
        >
            <span className="network-icon">{network.icon}</span>
            <span className="network-name">{network.name}</span>
            {!isCorrectNetwork && <span className="network-warning">⚡</span>}
        </div>
    );
}
