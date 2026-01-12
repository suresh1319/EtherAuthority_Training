import { ethers } from 'ethers';

let provider = null;
let signer = null;

export const web3Service = {
    // Connect to MetaMask
    connectWallet: async () => {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            // Create provider and signer
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();

            return {
                address: accounts[0],
                signer,
                provider,
            };
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    },

    // Get current wallet address
    getAddress: async () => {
        if (!signer) {
            throw new Error('Wallet not connected');
        }
        return await signer.getAddress();
    },

    // Get network information
    getNetwork: async () => {
        if (!provider) {
            throw new Error('Wallet not connected');
        }
        return await provider.getNetwork();
    },

    // Get balance
    getBalance: async (address) => {
        if (!provider) {
            throw new Error('Wallet not connected');
        }
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    },

    // Check if wallet is connected
    isConnected: () => {
        return !!signer;
    },

    // Disconnect wallet
    disconnect: () => {
        provider = null;
        signer = null;
    },

    // Format address (short form)
    formatAddress: (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
};

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            web3Service.disconnect();
            window.location.reload();
        } else {
            window.location.reload();
        }
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}
