import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
    // Get transaction history for a user
    async getTransactions(address, limit = 50, skip = 0) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/transactions/${address}`,
                {
                    params: { limit, skip }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    // Get user statistics
    async getUserStats(address) {
        try {
            const response = await axios.get(`${API_BASE_URL}/stats/user/${address}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }

    // Get protocol statistics
    async getProtocolStats() {
        try {
            const response = await axios.get(`${API_BASE_URL}/stats/protocol`);
            return response.data;
        } catch (error) {
            console.error('Error fetching protocol stats:', error);
            throw error;
        }
    }

    // Sync user transactions
    async syncTransactions(address) {
        try {
            const response = await axios.post(`${API_BASE_URL}/sync/${address}`);
            return response.data;
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw error;
        }
    }

    // Check backend health
    async checkHealth() {
        try {
            const response = await axios.get('http://localhost:3000/health');
            return response.data;
        } catch (error) {
            console.error('Backend health check failed:', error);
            return { status: 'offline' };
        }
    }
}

export default new ApiService();
