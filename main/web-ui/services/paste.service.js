const axios = require('axios');

const API_BASE_URL = process.env.PASTE_SERVICE_URL || 'http://localhost:3001/';

const createPaste = async (data) => {
    const response = await axios.post(`${API_BASE_URL}`, data);
    return response.data;
};

const getPasteById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

const getPublicPastes = async (page = 1) => {
    const response = await axios.get(`${API_BASE_URL}/public?page=${page}`);
    return response.data;
};

const getMonthlyStats = async (month) => {
    const response = await axios.get(`${API_BASE_URL}/stats/${month || ''}`);
    return response.data;
};

module.exports = {
    createPaste,
    getPasteById,
    getPublicPastes,
    getMonthlyStats
};
