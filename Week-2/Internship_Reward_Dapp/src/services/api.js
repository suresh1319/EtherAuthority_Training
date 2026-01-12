import axios from 'axios';

const INTERN_API_URL = 'http://localhost:3000/api/interns';
const TASK_API_URL = 'http://localhost:3001/api/tasks';

// Intern API
export const internAPI = {
    register: async (data) => {
        const response = await axios.post(`${INTERN_API_URL}/register`, data);
        return response.data;
    },

    getAll: async (params = {}) => {
        const response = await axios.get(INTERN_API_URL, { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${INTERN_API_URL}/${id}`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${INTERN_API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${INTERN_API_URL}/${id}`);
        return response.data;
    },
};

// Task API
export const taskAPI = {
    submit: async (data) => {
        const response = await axios.post(`${TASK_API_URL}/submit`, data);
        return response.data;
    },

    getAll: async (params = {}) => {
        const response = await axios.get(TASK_API_URL, { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${TASK_API_URL}/${id}`);
        return response.data;
    },

    getByIntern: async (internId, params = {}) => {
        const response = await axios.get(`${TASK_API_URL}/intern/${internId}`, { params });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${TASK_API_URL}/${id}`, data);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await axios.patch(`${TASK_API_URL}/${id}/status`, { status });
        return response.data;
    },

    review: async (id, reviewData) => {
        const response = await axios.patch(`${TASK_API_URL}/${id}/review`, reviewData);
        return response.data;
    },

    getStats: async (params = {}) => {
        const response = await axios.get(`${TASK_API_URL}/stats/summary`, { params });
        return response.data;
    },
};
