import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, History, Trophy, LogOut, Wallet, Briefcase, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PositionsPanel from './PositionsPanel';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    if (!user) return null;

    const isMarketOpen = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        const time = hours * 60 + minutes;
        return day >= 1 && day <= 5 && time >= 555 && time <= 930;
    };

    const NavLink = ({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'hover:bg-white/5 text-foreground/70 hover:text-foreground'
                    }`}
            >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="w-full md:w-72 bg-card/80 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col transition-colors duration-300">
            {/* Logo + Theme Toggle */}
            <div className="mb-6 flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <TrendingUp className="text-primary" size={24} />
                    </div>
                    <h1 className="text-lg font-black">VirtualTrade <span className="text-primary">Pro</span></h1>
                </div>
                <button
                    onClick={toggleTheme}
                    className="relative p-2.5 rounded-xl bg-background/50 hover:bg-background/80 border border-border/30 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    id="theme-toggle-btn"
                >
                    <div className="relative w-5 h-5">
                        <Sun size={20} className={`absolute inset-0 text-amber-400 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
                        <Moon size={20} className={`absolute inset-0 text-indigo-500 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                    </div>
                </button>
            </div>

            {/* Market Status */}
            <div className={`mb-4 mx-2 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium ${isMarketOpen() ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isMarketOpen() ? 'Market Open' : 'Market Closed'}
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-3">
                <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/positions" icon={Briefcase} label="Positions" />
                <NavLink to="/stocks" icon={TrendingUp} label="Trade Stocks" />
                <NavLink to="/history" icon={History} label="History" />
                <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
            </div>

            {/* Positions Panel */}
            <div className="border-t border-border/30 pt-2 mb-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <PositionsPanel />
                </div>
            </div>

            {/* Bottom */}
            <div className="mt-auto pt-3 border-t border-border/30 space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wallet size={18} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-medium">Cash Balance</p>
                        <p className="font-black text-sm">₹{user.balance?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <button onClick={logout} className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all duration-200">
                    <LogOut size={18} />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
