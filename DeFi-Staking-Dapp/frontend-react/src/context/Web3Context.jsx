import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, NETWORK } from '../contracts/config';
import DeFiStakingContractABI from '../contracts/DeFiStakingContractABI.json';
import ERC20ABI from '../contracts/ERC20ABI.json';

const Web3Context = createContext();

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contracts, setContracts] = useState({});
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Connect wallet
    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            if (!window.ethereum) {
                throw new Error('MetaMask is not installed. Please install MetaMask to use this dApp.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            // Check if on correct network
            if (Number(network.chainId) !== NETWORK.chainIdDecimal) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: NETWORK.chainId }],
                    });
                    // Reload after network switch
                    window.location.reload();
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        throw new Error('Please add Sepolia network to MetaMask');
                    }
                    throw switchError;
                }
            }

            // Initialize contracts
            const stakingContract = new ethers.Contract(
                CONTRACTS.STAKING_CONTRACT,
                DeFiStakingContractABI.abi,
                web3Signer
            );

            const stkTokenContract = new ethers.Contract(
                CONTRACTS.STK_TOKEN,
                ERC20ABI,
                web3Signer
            );

            const govTokenContract = new ethers.Contract(
                CONTRACTS.GOV_TOKEN,
                ERC20ABI,
                web3Signer
            );

            setAccount(accounts[0]);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(Number(network.chainId));
            setContracts({
                staking: stakingContract,
                stkToken: stkTokenContract,
                govToken: govTokenContract,
            });
        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect wallet
    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContracts({});
        setChainId(null);
    };

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    setAccount(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', () => { });
                window.ethereum.removeListener('chainChanged', () => { });
            }
        };
    }, []);

    const value = {
        account,
        provider,
        signer,
        contracts,
        chainId,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        isConnected: !!account,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
