import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/payments';
const API_URL = 'https://invoice-360-demo-production.up.railway.app/api/payments';


const getPayments = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const getPaymentById = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const createPayment = async (paymentData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updatePayment = async (id, paymentData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/${id}`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const deletePayment = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
};
