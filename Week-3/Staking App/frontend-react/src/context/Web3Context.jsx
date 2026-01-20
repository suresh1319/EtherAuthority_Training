import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import { BACKEND_API, SEPOLIA_CHAIN_ID, TOKEN_ABI, STAKING_ABI } from '../config/constants';

const Web3Context = createContext();

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [stakingContract, setStakingContract] = useState(null);
    const [contractAddresses, setContractAddresses] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentNetwork, setCurrentNetwork] = useState(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

    // Load contract addresses on mount
    useEffect(() => {
        loadContractAddresses();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());

            // Check for existing connection
            checkExistingConnection();
        }

        return () => {
            if (window.ethereum?.removeAllListeners) {
                window.ethereum.removeAllListeners('accountsChanged');
            }
        };
    }, []);

    // Initialize contracts when addresses are loaded and web3 is ready
    useEffect(() => {
        if (web3 && contractAddresses.StakingToken && contractAddresses.StakingContract) {
            initializeContracts();
        }
    }, [web3, contractAddresses]);

    const loadContractAddresses = async () => {
        try {
            const response = await fetch(`${BACKEND_API}/contracts?network=sepolia`);
            const data = await response.json();
            if (data.contracts) {
                setContractAddresses(data.contracts);
            }
        } catch (error) {
            console.error('Error loading contract addresses:', error);
        }
    };

    const checkExistingConnection = async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                handleAccountsChanged(accounts);
            }
        } catch (error) {
            console.error('Error checking existing connection:', error);
        }
    };

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            setAccount(null);
            setWeb3(null);
            setTokenContract(null);
            setStakingContract(null);
            setCurrentNetwork(null);
            setIsCorrectNetwork(false);
        } else {
            setAccount(accounts[0]);
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            // Check network
            await updateNetwork();
        }
    };

    const updateNetwork = async () => {
        if (window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                setCurrentNetwork(chainId);
                setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
            } catch (error) {
                console.error('Error getting network:', error);
            }
        }
    };

    const switchToSepolia = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID }],
            });
        } catch (error) {
            console.error('Failed to switch network:', error);
            alert('Please switch to Sepolia network in MetaMask');
        }
    };

    const initializeContracts = () => {
        try {
            const token = new web3.eth.Contract(TOKEN_ABI, contractAddresses.StakingToken);
            const staking = new web3.eth.Contract(STAKING_ABI, contractAddresses.StakingContract);
            setTokenContract(token);
            setStakingContract(staking);
            console.log('✅ Contracts initialized');
        } catch (error) {
            console.error('Error initializing contracts:', error);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask to use this app!');
            return;
        }

        try {
            setIsConnecting(true);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            await handleAccountsChanged(accounts);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setWeb3(null);
        setTokenContract(null);
        setStakingContract(null);
    };

    const value = {
        web3,
        account,
        tokenContract,
        stakingContract,
        contractAddresses,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        isConnecting,
        isConnected: !!account,
        currentNetwork,
        isCorrectNetwork
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
};
