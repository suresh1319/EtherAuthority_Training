// API service for backend communication
import { BACKEND_API } from '../config/constants';

export const apiService = {
    // Get contract addresses
    async getContractAddresses(network = 'sepolia') {
        const response = await fetch(`${BACKEND_API}/contracts?network=${network}`);
        return response.json();
    },

    // Record stake transaction
    async recordStake(data) {
        const response = await fetch(`${BACKEND_API}/stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Record unstake transaction
    async recordUnstake(data) {
        const response = await fetch(`${BACKEND_API}/unstake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Record claim rewards transaction
    async recordClaim(data) {
        const response = await fetch(`${BACKEND_API}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // Get user transaction history
    async getUserHistory(address) {
        const response = await fetch(`${BACKEND_API}/user/${address}`);
        return response.json();
    }
};
