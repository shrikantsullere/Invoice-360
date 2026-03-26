import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/superadmin/dashboard';
const API_URL = 'https://invoice-360-demo-production.up.railway.app/api/superadmin/dashboard';

const getDashboardStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const getCompanyStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/company-stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const getAnnouncements = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const createAnnouncement = async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/announcements`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateAnnouncement = async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/announcements/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const deleteAnnouncement = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getDashboardStats,
    getCompanyStats,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
};
