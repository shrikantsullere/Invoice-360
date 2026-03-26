import axiosInstance from '../api/axiosInstance';

const purchasePaymentService = {
    createPayment: async (data) => {
        const response = await axiosInstance.post('/purchase-payments', data);
        return response.data;
    },
    getPayments: async (companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await axiosInstance.get(`/purchase-payments${query}`);
        return response.data;
    },
    getPaymentById: async (id, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await axiosInstance.get(`/purchase-payments/${id}${query}`);
        return response.data;
    },
    updatePayment: async (id, data, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await axiosInstance.put(`/purchase-payments/${id}${query}`, data);
        return response.data;
    },
    deletePayment: async (id, companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await axiosInstance.delete(`/purchase-payments/${id}${query}`);
        return response.data;
    }
};

export default purchasePaymentService;
