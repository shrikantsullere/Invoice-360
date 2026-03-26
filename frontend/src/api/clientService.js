import axiosInstance from './axiosInstance';

const clientService = {
  getAllClients: async () => {
    const response = await axiosInstance.get('/clients');
    return response.data;
  },

  getClientById: async (id) => {
    const response = await axiosInstance.get(`/clients/${id}`);
    return response.data;
  },

  createClient: async (clientData) => {
    const response = await axiosInstance.post('/clients', clientData);
    return response.data;
  },

  updateClient: async (id, clientData) => {
    const response = await axiosInstance.put(`/clients/${id}`, clientData);
    return response.data;
  },

  deleteClient: async (id) => {
    const response = await axiosInstance.delete(`/clients/${id}`);
    return response.data;
  }
};

export default clientService;
