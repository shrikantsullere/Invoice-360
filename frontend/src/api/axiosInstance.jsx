import axios from 'axios';

const axiosInstance = axios.create({
    // baseURL: 'http://localhost:5000/api',
    baseURL: 'https://invoice-360-demo-production.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the access token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Assuming token is stored as 'token'
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
