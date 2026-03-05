import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get(`${API_BASE_URL}/auth/me`)
                .then(res => setUser(res.data))
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
