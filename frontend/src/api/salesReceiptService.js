import axios from './axiosInstance';

const salesReceiptService = {
    getAll: (companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        return axios.get(`/sales-receipts${query}`);
    },
    getById: (id, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        return axios.get(`/sales-receipts/${id}${query}`);
    },
    create: (data) => axios.post('/sales-receipts', data),
    update: (id, data, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        return axios.put(`/sales-receipts/${id}${query}`, data);
    },
    delete: (id, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        return axios.delete(`/sales-receipts/${id}${query}`);
    },
};

export default salesReceiptService;
