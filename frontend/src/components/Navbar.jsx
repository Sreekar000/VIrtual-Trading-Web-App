import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, History, Trophy, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const NavLink = ({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${active ? 'bg-primary text-white' : 'hover:bg-card-dark/10 dark:hover:bg-white/10'
                    }`}
            >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="w-full md:w-64 bg-card dark:bg-card-dark border-r border-border p-4 flex flex-col">
            <div className="mb-8 flex items-center space-x-2">
                <TrendingUp className="text-primary" size={32} />
                <h1 className="text-xl font-bold">VirtualTrade <span className="text-primary">Pro</span></h1>
            </div>

            <div className="space-y-2 flex-1">
                <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/stocks" icon={TrendingUp} label="Trade Stocks" />
                <NavLink to="/history" icon={History} label="History" />
                <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
            </div>

            <div className="mt-auto pt-4 border-t border-border space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                    <Wallet size={20} className="text-primary" />
                    <div>
                        <p className="text-xs text-foreground/60">Balance</p>
                        <p className="font-bold">${user.balance?.toLocaleString()}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
