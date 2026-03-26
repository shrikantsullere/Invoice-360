import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api',
    baseURL: 'https://invoice-360-demo-production.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user')); // Keep for user info if needed

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (user && user.token) {
            // Fallback for older sessions or if token is inside user
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors (like 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Auto logout if 401 occurred (optional)
            // localStorage.removeItem('user');
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
