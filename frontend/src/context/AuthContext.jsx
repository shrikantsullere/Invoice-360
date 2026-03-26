import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(undefined);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
        }
    }, []);

    const login = async (email, password) => {
        const response = await authService.login({ email, password });
        setCurrentUser(response.user);
        return response;
    };

    const register = async (name, email, password, company_id) => {
        const response = await authService.register({ name, email, password, company_id });
        setCurrentUser(response.user);
        return response;
    };

    const logout = () => {
        authService.logout();
        setCurrentUser(null);
    };

    const updateCurrentUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setCurrentUser(userData);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, updateCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};
