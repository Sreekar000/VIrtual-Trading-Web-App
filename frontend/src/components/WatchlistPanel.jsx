import React, { useState, useRef, useEffect } from 'react';
import { Star, Plus, Pencil, Trash2, X, ChevronDown, TrendingUp, TrendingDown, ArrowUpDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchlist } from '../context/WatchlistContext';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const WatchlistPanel = ({ onSelect }) => {
    const {
        watchlists, activeWatchlistId, setActiveWatchlistId,
        watchlistPrices, createWatchlist, renameWatchlist,
        deleteWatchlist, removeFromWatchlist
    } = useWatchlist();

    const [showDropdown, setShowDropdown] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [sortBy, setSortBy] = useState('alpha');
    const prevPricesRef = useRef({});
    const [flashMap, setFlashMap] = useState({});

    const activeWl = watchlists.find(w => w.id === activeWatchlistId);
    const items = activeWl?.WatchlistItems || [];

    // Detect price changes and trigger flash animations
    useEffect(() => {
        const newFlash = {};
        for (const [symbol, data] of Object.entries(watchlistPrices)) {
            const prev = prevPricesRef.current[symbol]?.c;
            if (prev !== undefined && data.c !== prev) {
                newFlash[symbol] = data.c > prev ? 'up' : 'down';
            }
        }
        if (Object.keys(newFlash).length > 0) {
            setFlashMap(newFlash);
            // Clear flash after animation
            const timer = setTimeout(() => setFlashMap({}), 1300);
            return () => clearTimeout(timer);
        }
        prevPricesRef.current = { ...watchlistPrices };
    }, [watchlistPrices]);

    const sortedItems = [...items].sort((a, b) => {
        if (sortBy === 'alpha') return a.stockSymbol.localeCompare(b.stockSymbol);
        if (sortBy === 'change') {
            const aChg = watchlistPrices[a.stockSymbol]?.dp || 0;
            const bChg = watchlistPrices[b.stockSymbol]?.dp || 0;
            return bChg - aChg;
        }
        if (sortBy === 'price') {
            const aP = watchlistPrices[a.stockSymbol]?.c || 0;
            const bP = watchlistPrices[b.stockSymbol]?.c || 0;
            return bP - aP;
        }
        return 0;
    });

    const handleCreate = async () => {
        if (!newName.trim()) return;
        const wl = await createWatchlist(newName.trim());
        if (wl) { setActiveWatchlistId(wl.id); setNewName(''); setIsCreating(false); }
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        await renameWatchlist(id, editName.trim());
        setEditingId(null);
        setEditName('');
    };

    const sortLabels = { alpha: 'A-Z', change: '% Chg', price: 'Price' };

    // Generate sparkline data for visual effect
    const getSparklineData = (symbol) => {
        const price = watchlistPrices[symbol]?.c || 100;
        return Array.from({ length: 12 }, (_, i) => ({
            v: price + (Math.sin(i * 0.8 + symbol.length) * price * 0.02) + (Math.random() * price * 0.005)
        }));
    };

    return (
        <div className="space-y-3">
            {/* Watchlist Selector */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 glass-card text-sm font-bold"
                    >
                        <span className="flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400" />
                            {activeWl?.name || 'Select Watchlist'}
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute z-50 w-full mt-1 glass-card rounded-xl overflow-hidden shadow-xl"
                            >
                                {watchlists.map(wl => (
                                    <div key={wl.id} className="flex items-center justify-between hover:bg-background/40 transition-colors">
                                        {editingId === wl.id ? (
                                            <div className="flex items-center gap-1 p-2 flex-1">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRename(wl.id)}
                                                    className="flex-1 p-1 bg-background border border-border/30 rounded text-xs"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleRename(wl.id)} className="text-emerald-400 text-xs">✓</button>
                                                <button onClick={() => setEditingId(null)} className="text-red-400 text-xs">✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setActiveWatchlistId(wl.id); setShowDropdown(false); }}
                                                    className={`flex-1 p-2.5 text-left text-xs font-medium ${wl.id === activeWatchlistId ? 'text-primary' : ''}`}
                                                >
                                                    {wl.name} ({wl.WatchlistItems?.length || 0})
                                                </button>
                                                <div className="flex items-center gap-0.5 pr-2">
                                                    <button onClick={() => { setEditingId(wl.id); setEditName(wl.name); }} className="p-1 hover:text-primary">
                                                        <Pencil size={10} />
                                                    </button>
                                                    {watchlists.length > 1 && (
                                                        <button onClick={() => deleteWatchlist(wl.id)} className="p-1 hover:text-red-400">
                                                            <Trash2 size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {isCreating ? (
                                    <div className="flex items-center gap-1 p-2 border-t border-border/20">
                                        <input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                            placeholder="Watchlist name"
                                            className="flex-1 p-1 bg-background border border-border/30 rounded text-xs"
                                            autoFocus
                                        />
                                        <button onClick={handleCreate} className="text-emerald-400 text-xs font-bold">Add</button>
                                        <button onClick={() => setIsCreating(false)} className="text-red-400"><X size={12} /></button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="w-full p-2.5 text-left text-xs font-medium text-primary hover:bg-primary/5 border-t border-border/20 flex items-center gap-1"
                                    >
                                        <Plus size={12} /> New Watchlist
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sort Toggle */}
                <button
                    onClick={() => setSortBy(s => s === 'alpha' ? 'change' : s === 'change' ? 'price' : 'alpha')}
                    className="p-2 glass-card flex items-center gap-1"
                    title={`Sort: ${sortLabels[sortBy]}`}
                >
                    <ArrowUpDown size={14} />
                    <span className="text-[10px] font-bold hidden sm:inline">{sortLabels[sortBy]}</span>
                </button>
            </div>

            {/* Watchlist Items */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin">
                {sortedItems.length === 0 ? (
                    <div className="text-center py-6 text-foreground/20 text-xs">
                        <Star size={24} className="mx-auto mb-2 opacity-30" />
                        <p>No stocks in this watchlist</p>
                        <p className="mt-1">Search and add stocks using ★</p>
                    </div>
                ) : (
                    sortedItems.map((item) => {
                        const quote = watchlistPrices[item.stockSymbol];
                        const price = quote?.c || 0;
                        const changePct = quote?.dp || 0;
                        const direction = quote?.priceDirection;
                        const isUp = changePct >= 0;
                        const flash = flashMap[item.stockSymbol];

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                className={`group flex items-center gap-2 p-2.5 rounded-lg hover:bg-background/40 transition-all cursor-pointer ${flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : ''}`}
                                onClick={() => onSelect && onSelect(item.stockSymbol)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-bold text-sm truncate">{item.stockSymbol.replace('.NS', '')}</p>
                                    </div>
                                    <p className="text-[10px] text-foreground/30 truncate">{item.companyName || item.stockSymbol}</p>
                                </div>

                                {/* Sparkline */}
                                <div className="w-16 h-6 flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={getSparklineData(item.stockSymbol)}>
                                            <Line type="monotone" dataKey="v" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className={`text-xs font-bold transition-all duration-500 ${direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : ''}`}>
                                        ₹{price.toFixed(2)}
                                    </p>
                                    <p className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isUp ? '+' : ''}{changePct.toFixed(2)}%
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(activeWatchlistId, item.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-foreground/30 hover:text-red-400 transition-all"
                                >
                                    <Minus size={12} />
                                </button>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WatchlistPanel;
