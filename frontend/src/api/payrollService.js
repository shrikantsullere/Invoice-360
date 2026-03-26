import axiosInstance from './axiosInstance';

const payrollService = {
  // Employee Management
  createEmployee: async (data) => {
    const response = await axiosInstance.post('/payroll/employees', data);
    return response.data;
  },
  getAllEmployees: async () => {
    const response = await axiosInstance.get('/payroll/employees');
    return response.data;
  },
  updateEmployee: async (id, data) => {
    const response = await axiosInstance.put(`/payroll/employees/${id}`, data);
    return response.data;
  },
  deleteEmployee: async (id) => {
    const response = await axiosInstance.delete(`/payroll/employees/${id}`);
    return response.data;
  },

  // Salary Structure
  createStructure: async (data) => {
    const response = await axiosInstance.post('/payroll/structures', data);
    return response.data;
  },
  getAllStructures: async () => {
    const response = await axiosInstance.get('/payroll/structures');
    return response.data;
  },
  updateStructure: async (id, data) => {
    const response = await axiosInstance.put(`/payroll/structures/${id}`, data);
    return response.data;
  },
  addComponent: async (id, data) => {
    const response = await axiosInstance.post(`/payroll/structures/${id}/components`, data);
    return response.data;
  },
  assignStructure: async (data) => {
    const response = await axiosInstance.post('/payroll/structures/assign', data);
    return response.data;
  },

  // Payroll History / Generation
  generatePayroll: async (data) => {
    const response = await axiosInstance.post('/payroll/generate', data);
    return response.data;
  },
  getPayrollHistory: async (params) => {
    const response = await axiosInstance.get('/payroll/history', { params });
    return response.data;
  },
  updatePayrollStatus: async (id, status) => {
    const response = await axiosInstance.put(`/payroll/status/${id}`, { status });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await axiosInstance.get('/payroll/settings');
    return response.data;
  },
  updateSettings: async (data) => {
    const response = await axiosInstance.put('/payroll/settings', data);
    return response.data;
  }
};

export default payrollService;
