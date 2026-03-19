import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Briefcase, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const { portfolio, stats, loading } = usePortfolio();
    const [pnlFlash, setPnlFlash] = React.useState(null);
    const prevProfitRef = React.useRef(0);

    React.useEffect(() => {
        if (stats.profit !== prevProfitRef.current) {
            setPnlFlash(stats.profit > prevProfitRef.current ? 'up' : 'down');
            prevProfitRef.current = stats.profit;
            const timer = setTimeout(() => setPnlFlash(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [stats.profit]);

    const isMarketOpen = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        const time = hours * 60 + minutes;
        return day >= 1 && day <= 5 && time >= 555 && time <= 930;
    };

    const StatCard = ({ title, value, subValue, icon: Icon, colorClass, subColorClass, delay = 0, className = '' }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.4 }}
            className={`glass-card p-6 flex items-start justify-between group hover:scale-[1.02] transition-transform duration-300 ${className}`}
        >
            <div>
                <p className="text-xs font-medium text-foreground/40 mb-1 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black">{value}</h3>
                {subValue && <p className={`text-sm mt-1 font-bold ${subColorClass || colorClass}`}>{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colorClass?.includes('green') || colorClass?.includes('emerald') ? 'bg-emerald-500/10' : colorClass?.includes('red') ? 'bg-red-500/10' : colorClass?.includes('purple') ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
                <Icon className={colorClass || 'text-primary'} size={22} />
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2"><SkeletonChart /></div>
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    // Chart data from portfolio
    const INITIAL_CAPITAL = 1000000;
    const performanceData = [
        { date: 'Start', val: INITIAL_CAPITAL },
        { date: 'Invested', val: INITIAL_CAPITAL - (stats.totalInvested || 0) + (stats.currentValue || 0) * 0.7 },
        { date: 'Mid', val: INITIAL_CAPITAL - (stats.totalInvested || 0) + (stats.currentValue || 0) * 0.85 },
        { date: 'Recent', val: INITIAL_CAPITAL - (stats.totalInvested || 0) + (stats.currentValue || 0) * 0.95 },
        { date: 'Now', val: stats.totalValue || INITIAL_CAPITAL }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">Dashboard</h1>
                    <p className="text-foreground/40">Welcome back, <span className="text-foreground font-medium">{user.name}</span></p>
                </div>
                <div className={`flex items-center gap-2 glass-card px-4 py-2 rounded-xl ${isMarketOpen() ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                    <div className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-sm font-medium ${isMarketOpen() ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isMarketOpen() ? 'Market Open' : 'Market Closed'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Portfolio Value"
                    value={`₹${(stats.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    subValue={stats.profit >= 0
                        ? `+₹${stats.profit?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${stats.profitPercent?.toFixed(2)}%)`
                        : `₹${stats.profit?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${stats.profitPercent?.toFixed(2)}%)`}
                    icon={BarChart3}
                    colorClass={stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                    delay={0}
                    className={pnlFlash === 'up' ? 'price-flash-up' : pnlFlash === 'down' ? 'price-flash-down' : ''}
                />
                <StatCard
                    title="Cash Balance"
                    value={`₹${(user.balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    icon={Wallet}
                    colorClass="text-primary"
                    delay={1}
                />
                <StatCard
                    title="Total Positions"
                    value={portfolio.length}
                    subValue={portfolio.length > 0 ? `${stats.dayChange >= 0 ? '+' : ''}₹${stats.dayChange?.toFixed(2)} today` : undefined}
                    icon={Briefcase}
                    colorClass="text-purple-400"
                    subColorClass={stats.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}
                    delay={2}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 glass-card p-6"
                >
                    <h3 className="text-lg font-bold mb-6">Performance</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    formatter={(val) => [`₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Value']}
                                />
                                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Top Positions</h3>
                        <Link to="/positions" className="text-xs text-primary hover:text-primary/80 transition-colors">View all →</Link>
                    </div>
                    <div className="space-y-3">
                        {portfolio.length === 0 ? (
                            <p className="text-center text-foreground/30 py-8">No active positions</p>
                        ) : (
                            portfolio.slice(0, 5).map((item) => (
                                <div key={item.stockSymbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-background/40 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                            {item.profit >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{item.stockSymbol.replace('.NS', '')}</p>
                                            <p className="text-[10px] text-foreground/40">{item.quantity} Shares</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">₹{item.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                        <p className={`text-[10px] font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {item.profit >= 0 ? '+' : ''}₹{item.profit?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
