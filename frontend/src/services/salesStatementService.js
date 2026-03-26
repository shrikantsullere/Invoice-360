import axiosInstance from '../api/axiosInstance';

const getSalesStatement = async (filters = {}) => {
  const response = await axiosInstance.get('/sales-statements', { params: filters });
  return response.data;
};

const salesStatementService = {
  getSalesStatement
};

export default salesStatementService;
