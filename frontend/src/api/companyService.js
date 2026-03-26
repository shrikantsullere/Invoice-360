import axiosInstance from './axiosInstance';

const companyService = {
    getById: (id) => axiosInstance.get(`/companies/${id}`),
    update: (id, data) => {
        // Since we might have files, we should use FormData
        // But if data is already FormData, just send it
        return axiosInstance.put(`/companies/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default companyService;
