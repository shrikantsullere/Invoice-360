import axiosInstance from "../api/axiosInstance";

const posService = {
    createPOSInvoice: async (data) => {
        const response = await axiosInstance.post('/pos-invoices', data);
        return response.data;
    },
    getPOSInvoices: async (companyId) => {
        const query = companyId ? `?companyId=${companyId}` : '';
        const response = await axiosInstance.get(`/pos-invoices${query}`);
        return response.data;
    },
    getPOSInvoiceById: async (id) => {
        const response = await axiosInstance.get(`/pos-invoices/${id}`);
        return response.data;
    },
    deletePOSInvoice: async (id) => {
        const response = await axiosInstance.delete(`/pos-invoices/${id}`);
        return response.data;
    }
};

export default posService;
