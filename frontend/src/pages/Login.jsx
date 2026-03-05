import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock } from 'lucide-react';
import API_BASE_URL from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/10 p-4 rounded-2xl mb-4">
                        <TrendingUp size={40} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Welcome Back</h2>
                    <p className="text-foreground/60">Log in to your account</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all transform active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-foreground/60">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
