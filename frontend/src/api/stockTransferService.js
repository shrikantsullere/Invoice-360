import axiosInstance from './axiosInstance';

const getStockTransfers = async (companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    const response = await axiosInstance.get(`/stock-transfers${query}`);
    return response.data;
};

const getStockTransferById = async (id, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    const response = await axiosInstance.get(`/stock-transfers/${id}${query}`);
    return response.data;
};

const createStockTransfer = async (data) => {
    const response = await axiosInstance.post('/stock-transfers', data);
    return response.data;
};

const deleteStockTransfer = async (id, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    const response = await axiosInstance.delete(`/stock-transfers/${id}${query}`);
    return response.data;
};

const stockTransferService = {
    getStockTransfers,
    getStockTransferById,
    createStockTransfer,
    deleteStockTransfer
};

export default stockTransferService;
