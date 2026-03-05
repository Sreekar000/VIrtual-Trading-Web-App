import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, ArrowUpRight, ArrowDownRight, ArrowUpDown, Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { SkeletonTable } from '../components/LoadingSkeleton';

const History = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('newest');
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/trades/history`);
            setTrades(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Robust date parser that handles IST timestamps like "2026-03-02T14:10:35+05:30"
    const getTradeDate = (trade) => {
        const raw = trade.executedAt || trade.createdAt;
        if (!raw) return null;
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
        // Fallback: try parsing manually for formats like "2026-03-02T14:10:35+05:30"
        try {
            const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (match) {
                return new Date(raw.replace('+05:30', 'Z')); // approximate
            }
        } catch { }
        return null;
    };

    const formatDate = (trade) => {
        const d = getTradeDate(trade);
        if (!d) return '—';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (trade) => {
        const d = getTradeDate(trade);
        if (!d) return '—';
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    // Get IST "today" boundary for accurate filtering
    const getISTNow = () => {
        const now = new Date();
        return now; // browser handles timezone via locale
    };

    const filterByDate = (trade) => {
        const d = getTradeDate(trade);
        if (!d) return dateFilter === 'all';
        const now = getISTNow();

        if (dateFilter === 'today') {
            return d.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return d >= weekAgo;
        } else if (dateFilter === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'custom' && customFrom && customTo) {
            const from = new Date(customFrom);
            const to = new Date(customTo);
            to.setHours(23, 59, 59, 999);
            return d >= from && d <= to;
        }
        return true;
    };

    const filteredTrades = trades
        .filter(filterByDate)
        .sort((a, b) => {
            const dateA = getTradeDate(a) || new Date(0);
            const dateB = getTradeDate(b) || new Date(0);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const filterLabels = { all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom Range' };

    if (loading) return <SkeletonTable rows={8} />;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">Transaction History</h1>
                    <p className="text-foreground/40 text-sm">Review your past trades and performance</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sort Toggle */}
                    <button
                        onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-1.5 px-3 py-2 glass-card text-xs font-medium hover:bg-background/50 transition-colors"
                    >
                        <ArrowUpDown size={14} />
                        {sortOrder === 'newest' ? 'Latest First' : 'Oldest First'}
                    </button>

                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 glass-card text-xs font-medium hover:bg-background/50 transition-colors"
                        >
                            <Calendar size={14} />
                            {filterLabels[dateFilter]}
                            <ChevronDown size={12} />
                        </button>

                        <AnimatePresence>
                            {showFilterMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute right-0 z-50 mt-1 glass-card rounded-xl overflow-hidden shadow-xl w-52"
                                >
                                    {Object.entries(filterLabels).filter(([k]) => k !== 'custom').map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setDateFilter(key); setShowFilterMenu(false); }}
                                            className={`w-full p-2.5 text-left text-xs font-medium hover:bg-background/50 transition-colors ${dateFilter === key ? 'bg-primary/10 text-primary' : ''}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                    <div className="border-t border-border/20 p-2.5 space-y-2">
                                        <p className="text-[10px] text-foreground/40 font-bold uppercase">Custom Range</p>
                                        <input
                                            type="date"
                                            value={customFrom}
                                            onChange={(e) => setCustomFrom(e.target.value)}
                                            className="w-full p-1.5 bg-background border border-border/30 rounded-lg text-xs"
                                        />
                                        <input
                                            type="date"
                                            value={customTo}
                                            onChange={(e) => setCustomTo(e.target.value)}
                                            className="w-full p-1.5 bg-background border border-border/30 rounded-lg text-xs"
                                        />
                                        <button
                                            onClick={() => { setDateFilter('custom'); setShowFilterMenu(false); }}
                                            className="w-full p-1.5 bg-primary text-white text-xs font-bold rounded-lg"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-primary/5 border-b border-border/30">
                                <th className="p-3 font-bold text-foreground/50 text-xs">Type</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs">Asset</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs">Qty</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs">Price</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs">Total</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs">Date</th>
                                <th className="p-3 font-bold text-foreground/50 text-xs text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {filteredTrades.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-foreground/30">
                                        <HistoryIcon size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>No transactions found</p>
                                        {dateFilter !== 'all' && (
                                            <button onClick={() => setDateFilter('all')} className="text-primary text-xs mt-2 hover:underline">
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredTrades.map((trade, idx) => (
                                    <motion.tr
                                        key={trade.id || idx}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover:bg-background/30 transition-colors"
                                    >
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {trade.type === 'BUY' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {trade.type}
                                            </span>
                                        </td>
                                        <td className="p-3 font-black text-sm">{trade.stockSymbol?.replace('.NS', '')}</td>
                                        <td className="p-3">{trade.quantity}</td>
                                        <td className="p-3">₹{trade.price?.toFixed(2)}</td>
                                        <td className="p-3 font-bold">₹{(trade.price * trade.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-foreground/60 text-xs">{formatDate(trade)}</td>
                                        <td className="p-3 text-right text-foreground/40 text-xs">{formatTime(trade)}</td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredTrades.length > 0 && (
                    <div className="p-3 border-t border-border/20 text-xs text-foreground/30 text-center">
                        Showing {filteredTrades.length} of {trades.length} transactions
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
