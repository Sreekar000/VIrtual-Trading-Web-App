import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, BarChart3, Target, Award, AlertTriangle,
    DollarSign, Activity, Percent, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePortfolio } from '../context/PortfolioContext';
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton';
import SellModal from '../components/SellModal';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

const Positions = () => {
    const { portfolio, stats, lifetimeStats, loading, sellStock } = usePortfolio();
    const [sellTarget, setSellTarget] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [flashMap, setFlashMap] = useState({});
    const prevPricesRef = React.useRef({});

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Detect price changes and trigger flash animations
    React.useEffect(() => {
        const newFlash = {};
        portfolio.forEach(item => {
            const prev = prevPricesRef.current[item.stockSymbol];
            const current = item.currentPrice;
            if (prev !== undefined && current !== prev) {
                newFlash[item.stockSymbol] = current > prev ? 'up' : 'down';
            }
            prevPricesRef.current[item.stockSymbol] = current;
        });

        if (Object.keys(newFlash).length > 0) {
            setFlashMap(newFlash);
            const timer = setTimeout(() => setFlashMap({}), 1300);
            return () => clearTimeout(timer);
        }
    }, [portfolio]);

    const isMarketOpen = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        const time = hours * 60 + minutes;
        return day >= 1 && day <= 5 && time >= 555 && time <= 930; // 9:15 AM to 3:30 PM
    };

    // Allocation data for pie chart
    const allocationData = portfolio.map((item, i) => ({
        name: item.stockSymbol.replace('.NS', ''),
        value: item.value || 0,
        color: COLORS[i % COLORS.length]
    }));

    // P&L data for line chart (simulated over time from portfolio)
    const pnlData = portfolio.map((item, i) => ({
        name: item.stockSymbol.replace('.NS', ''),
        pnl: item.profit || 0,
        value: item.value || 0
    }));

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '₹0';
        return `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const parseDateStr = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        // Fallback manual parse for IST format
        try {
            const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (match) {
                const [, y, mo, da, h, mi, s] = match;
                return new Date(`${y}-${mo}-${da}T${h}:${mi}:${s}+05:30`);
            }
        } catch { }
        return null;
    };

    const formatBuyDate = (dateStr) => {
        const d = parseDateStr(dateStr);
        if (!d) return '—';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getHoldingDuration = (dateStr) => {
        const buyDate = parseDateStr(dateStr);
        if (!buyDate) return '—';
        const now = new Date();
        const diffMs = now - buyDate;
        if (diffMs < 0) return '0h';
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days === 0) return `${hours}h`;
        return `${days}d ${hours}h`;
    };

    const StatBox = ({ label, value, subtext, icon: Icon, color = 'text-primary' }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 space-y-1"
        >
            <div className="flex items-center justify-between">
                <p className="text-xs text-foreground/50 font-medium">{label}</p>
                {Icon && <Icon size={16} className={color} />}
            </div>
            <p className="text-lg font-black">{value}</p>
            {subtext && <p className={`text-xs font-medium ${color}`}>{subtext}</p>}
        </motion.div>
    );

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
                <SkeletonChart />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">Positions</h1>
                    <p className="text-foreground/50">Detailed portfolio analysis & performance</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl glass-card`}>
                    <div className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-sm font-medium">{isMarketOpen() ? 'Market Open' : 'Market Closed'}</span>
                </div>
            </header>

            {/* Section A: Current Performance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox
                    label="Unrealized P&L"
                    value={formatCurrency(stats.profit)}
                    subtext={`${stats.profitPercent >= 0 ? '+' : ''}${stats.profitPercent?.toFixed(2)}%`}
                    icon={stats.profit >= 0 ? TrendingUp : TrendingDown}
                    color={stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <StatBox
                    label="Total Investment"
                    value={formatCurrency(stats.totalInvested)}
                    icon={DollarSign}
                    color="text-primary"
                />
                <StatBox
                    label="Current Value"
                    value={formatCurrency(stats.currentValue)}
                    icon={BarChart3}
                    color="text-purple-400"
                />
                <StatBox
                    label="Day Change"
                    value={formatCurrency(stats.dayChange)}
                    subtext={`${stats.dayChangePercent >= 0 ? '+' : ''}${stats.dayChangePercent?.toFixed(2)}%`}
                    icon={Activity}
                    color={stats.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
            </div>

            {/* Holdings Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <h3 className="font-bold">Current Holdings</h3>
                    <span className="text-xs text-foreground/40">{portfolio.length} position{portfolio.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-primary/5 border-b border-border/30">
                                <th className="p-3 font-bold text-foreground/60">Symbol</th>
                                <th className="p-3 font-bold text-foreground/60">Qty</th>
                                <th className="p-3 font-bold text-foreground/60">Avg. Price</th>
                                <th className="p-3 font-bold text-foreground/60">CMP</th>
                                <th className="p-3 font-bold text-foreground/60">Current Value</th>
                                <th className="p-3 font-bold text-foreground/60">P&L</th>
                                <th className="p-3 font-bold text-foreground/60">Buy Date</th>
                                <th className="p-3 font-bold text-foreground/60">Holding</th>
                                <th className="p-3 font-bold text-foreground/60 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {portfolio.length === 0 ? (
                                <tr><td colSpan="9" className="p-8 text-center text-foreground/30">No open positions</td></tr>
                            ) : (
                                portfolio.map((item) => (
                                    <motion.tr
                                        key={item.stockSymbol}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-background/40 transition-colors"
                                    >
                                        <td className="p-3 font-black">{item.stockSymbol.replace('.NS', '')}</td>
                                        <td className="p-3">{item.quantity}</td>
                                        <td className="p-3">₹{item.averagePrice?.toFixed(2)}</td>
                                        <td className={`p-3 font-bold transition-all duration-500 ${flashMap[item.stockSymbol] === 'up' ? 'price-flash-up text-emerald-400' : flashMap[item.stockSymbol] === 'down' ? 'price-flash-down text-red-400' : 'text-primary'}`}>
                                            ₹{item.currentPrice?.toFixed(2)}
                                        </td>
                                        <td className="p-3 font-medium">₹{item.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td className={`p-3 ${flashMap[item.stockSymbol] === 'up' ? 'price-flash-up' : flashMap[item.stockSymbol] === 'down' ? 'price-flash-down' : ''}`}>
                                            <div className={`font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {item.profit >= 0 ? '+' : ''}₹{item.profit?.toFixed(2)}
                                                <span className="text-xs ml-1">({item.profitPercent >= 0 ? '+' : ''}{item.profitPercent?.toFixed(1)}%)</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-foreground/50 text-xs">{formatBuyDate(item.firstBuyDate)}</td>
                                        <td className="p-3 text-foreground/50 text-xs font-medium">{getHoldingDuration(item.firstBuyDate)}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => setSellTarget(item)}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                            >
                                                SELL
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section B: Lifetime Performance */}
            <div className="glass-card overflow-hidden">
                <button
                    onClick={() => toggleSection('lifetime')}
                    className="w-full p-4 flex items-center justify-between hover:bg-background/30 transition-colors"
                >
                    <h3 className="font-bold flex items-center gap-2"><Award size={18} className="text-primary" /> Lifetime Performance</h3>
                    {expandedSection === 'lifetime' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {(expandedSection === 'lifetime' || expandedSection === null) && lifetimeStats && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <StatBox label="Realized P&L" value={formatCurrency(lifetimeStats.realizedPnl)} icon={DollarSign} color={lifetimeStats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                        <StatBox label="Total Trades" value={lifetimeStats.totalTrades} icon={Activity} />
                        <StatBox label="Win Rate" value={`${lifetimeStats.winRate}%`} icon={Target} color={lifetimeStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'} />
                        <StatBox label="Avg. Gain" value={formatCurrency(lifetimeStats.avgGain)} icon={TrendingUp} color="text-emerald-400" />
                        <StatBox label="Avg. Loss" value={formatCurrency(lifetimeStats.avgLoss)} icon={TrendingDown} color="text-red-400" />
                        <StatBox label="Best Trade" value={lifetimeStats.bestTrade ? `${lifetimeStats.bestTrade.symbol?.replace('.NS', '')} ${formatCurrency(lifetimeStats.bestTrade.profit)}` : 'N/A'} icon={Award} color="text-emerald-400" />
                        <StatBox label="Worst Trade" value={lifetimeStats.worstTrade ? `${lifetimeStats.worstTrade.symbol?.replace('.NS', '')} ${formatCurrency(lifetimeStats.worstTrade.profit)}` : 'N/A'} icon={AlertTriangle} color="text-red-400" />
                        <StatBox label="Holding Period" value={`${portfolio.length} active`} icon={Clock} />
                    </motion.div>
                )}
            </div>

            {/* Section C: Statistics */}
            {lifetimeStats && (
                <div className="glass-card overflow-hidden">
                    <button
                        onClick={() => toggleSection('statistics')}
                        className="w-full p-4 flex items-center justify-between hover:bg-background/30 transition-colors"
                    >
                        <h3 className="font-bold flex items-center gap-2"><BarChart3 size={18} className="text-purple-400" /> Statistics</h3>
                        {expandedSection === 'statistics' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {(expandedSection === 'statistics' || expandedSection === null) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            <StatBox label="Risk-Reward Ratio" value={`${lifetimeStats.riskRewardRatio}:1`} icon={Target} color="text-cyan-400" />
                            <StatBox label="Sharpe Ratio" value={lifetimeStats.sharpeRatio?.toFixed(2)} icon={Percent} color={lifetimeStats.sharpeRatio > 1 ? 'text-emerald-400' : 'text-amber-400'} />
                            <StatBox label="Total Brokerage" value={formatCurrency(lifetimeStats.totalBrokerage)} icon={DollarSign} color="text-foreground/50" />
                            <StatBox label="Positions" value={`${portfolio.length} open`} icon={Activity} />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Section D: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* P&L Bar visualization */}
                <div className="glass-card p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-400" /> Position P&L
                    </h3>
                    <div className="h-[280px]">
                        {portfolio.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={portfolio.map(p => ({
                                    name: p.stockSymbol.replace('.NS', ''),
                                    pnl: p.profit,
                                    value: p.value
                                }))}>
                                    <defs>
                                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        formatter={(val) => [`₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
                                    />
                                    <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#pnlGrad)" name="P&L" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-foreground/30">No data</div>
                        )}
                    </div>
                </div>

                {/* Allocation Pie Chart */}
                <div className="glass-card p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-purple-400" /> Allocation
                    </h3>
                    <div className="h-[280px]">
                        {allocationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        formatter={(val) => [`₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
                                    />
                                    <Legend
                                        formatter={(value) => <span className="text-xs text-foreground/70">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-foreground/30">No data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Trade P&L history chart */}
            {lifetimeStats && lifetimeStats.completedTrades && lifetimeStats.completedTrades.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-cyan-400" /> P&L Over Time
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lifetimeStats.completedTrades.map((t, i) => ({
                                trade: i + 1,
                                profit: t.profit,
                                cumulative: lifetimeStats.completedTrades.slice(0, i + 1).reduce((s, x) => s + x.profit, 0)
                            }))}>
                                <defs>
                                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                <XAxis dataKey="trade" stroke="#888" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Trade #', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#888' }} />
                                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    formatter={(val, name) => [`₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, name === 'cumulative' ? 'Cumulative' : 'Trade P&L']}
                                />
                                <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} name="cumulative" />
                                <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" dot={{ r: 3, fill: '#8b5cf6' }} name="profit" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {sellTarget && (
                <SellModal
                    stock={sellTarget}
                    onClose={() => setSellTarget(null)}
                    onSell={sellStock}
                />
            )}
        </div>
    );
};

export default Positions;
