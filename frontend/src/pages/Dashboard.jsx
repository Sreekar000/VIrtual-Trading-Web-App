import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Briefcase, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalValue: 0, profit: 0, profitPercent: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/trades/portfolio');
            const portfolioData = res.data;

            // Calculate current value (in real app, fetch current prices for each)
            let currentTotalValue = 0;
            let totalInvested = 0;

            const enrichedPortfolio = await Promise.all(portfolioData.map(async (item) => {
                const quoteRes = await axios.get(`http://localhost:5000/api/stocks/quote/${item.stockSymbol}`);
                const currentPrice = quoteRes.data.c;
                const value = currentPrice * item.quantity;
                const invested = item.averagePrice * item.quantity;
                const profit = value - invested;

                currentTotalValue += value;
                totalInvested += invested;

                return { ...item, currentPrice, value, profit };
            }));

            setPortfolio(enrichedPortfolio);
            const profit = currentTotalValue - totalInvested;
            const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

            setStats({
                totalValue: currentTotalValue + user.balance,
                profit,
                profitPercent
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subValue, icon: Icon, colorClass }) => (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-foreground/60 mb-1">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                {subValue && <p className={`text-sm mt-1 font-medium ${colorClass}`}>{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('500', '500/10')}`}>
                <Icon className={colorClass} size={24} />
            </div>
        </div>
    );

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]">Loading Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-foreground/60">Welcome back, {user.name}</p>
                </div>
                <div className="bg-card px-4 py-2 rounded-xl border border-border flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Market Open</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Portfolio Value"
                    value={`₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    subValue={stats.profit >= 0 ? `+₹${stats.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${stats.profitPercent.toFixed(2)}%)` : `₹${stats.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${stats.profitPercent.toFixed(2)}%)`}
                    icon={BarChart3}
                    colorClass={stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}
                />
                <StatCard
                    title="Cash Balance"
                    value={`₹${user.balance.toLocaleString('en-IN')}`}
                    icon={Wallet}
                    colorClass="text-primary"
                />
                <StatCard
                    title="Total Positions"
                    value={portfolio.length}
                    icon={Briefcase}
                    colorClass="text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-xl font-bold mb-6">Performance</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { date: 'Mon', val: 1000000 },
                                { date: 'Tue', val: 1020000 },
                                { date: 'Wed', val: 1015000 },
                                { date: 'Thu', val: 1050000 },
                                { date: 'Fri', val: stats.totalValue }
                            ]}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border">
                    <h3 className="text-xl font-bold mb-6">Positions</h3>
                    <div className="space-y-4">
                        {portfolio.length === 0 ? (
                            <p className="text-center text-foreground/40 py-8">No active positions</p>
                        ) : (
                            portfolio.map((item) => (
                                <div key={item.stockSymbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-background transition-colors">
                                    <div>
                                        <p className="font-bold text-lg">{item.stockSymbol}</p>
                                        <p className="text-xs text-foreground/60">{item.quantity} Shares</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                        <p className={`text-xs font-medium ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
