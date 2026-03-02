import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Search, TrendingUp, TrendingDown, Activity, X, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrade } from '../context/TradeContext';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/LoadingSkeleton';

const Stocks = () => {
    const { user, setUser } = useAuth();
    const { executeTrade } = useTrade();
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quote, setQuote] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);
    const debounceRef = useRef(null);

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const debouncedSearch = useCallback((query) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query || query.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            setSearchLoading(false);
            return;
        }
        setSearchLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/stocks/search?q=${query}`);
                setSuggestions(res.data.result || []);
                setShowSuggestions(true);
                setHighlightIndex(-1);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        debouncedSearch(val);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
                selectStock(suggestions[highlightIndex].symbol);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIndex >= 0 && suggestionsRef.current) {
            const items = suggestionsRef.current.children;
            if (items[highlightIndex]) {
                items[highlightIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightIndex]);

    const selectStock = async (symbol) => {
        setSearch(symbol);
        setShowSuggestions(false);
        setQuoteLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/stocks/quote/${symbol}`);
            setQuote(res.data);
            setSelectedStock(symbol);
            setMessage({ text: '', type: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setQuoteLoading(false);
        }
    };

    const handleTrade = async (type) => {
        const result = await executeTrade(type, selectedStock, quantity);
        if (result.success) {
            setMessage({ text: result.message, type: 'success' });
            setUser({ ...user, balance: result.balance });
            // Refresh the quote
            selectStock(selectedStock);
        } else {
            setMessage({ text: result.message, type: 'error' });
        }
    };

    // Highlight matching text
    const highlightMatch = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className="bg-primary/30 text-primary font-bold rounded px-0.5">{part}</mark> : part
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black">Trade Stocks</h1>
                <p className="text-foreground/50">Search and trade thousands of stocks</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Search Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div ref={searchRef} className="relative">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" size={20} />
                            <input
                                type="text"
                                className="w-full pl-11 pr-10 py-3.5 glass-card bg-card border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                                placeholder="Search stocks (e.g. RELIANCE, TCS)"
                                value={search}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                id="stock-search-input"
                            />
                            {searchLoading && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            )}
                            {search && !searchLoading && (
                                <button
                                    onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute z-50 w-full mt-1.5 glass-card rounded-xl overflow-hidden shadow-2xl shadow-black/20 max-h-[380px] overflow-y-auto"
                                    ref={suggestionsRef}
                                    id="stock-suggestions-dropdown"
                                >
                                    <div className="p-2 text-[10px] text-foreground/30 uppercase tracking-wider font-bold border-b border-border/20 px-3">
                                        {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                                    </div>
                                    {suggestions.map((s, index) => (
                                        <button
                                            key={s.symbol}
                                            onClick={() => selectStock(s.symbol)}
                                            className={`w-full p-3 text-left flex items-center justify-between transition-all ${index === highlightIndex
                                                    ? 'bg-primary/10 border-l-2 border-l-primary'
                                                    : 'hover:bg-background/50 border-l-2 border-l-transparent'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm">{highlightMatch(s.symbol.replace('.NS', '').replace('.BO', ''), search)}</p>
                                                <p className="text-[11px] text-foreground/40 truncate">{highlightMatch(s.description, search)}</p>
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                {s.price ? (
                                                    <>
                                                        <p className="text-sm font-bold">₹{s.price?.toFixed(2)}</p>
                                                        <p className={`text-[10px] font-bold ${(s.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {(s.changePercent || 0) >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                                                        </p>
                                                    </>
                                                ) : (
                                                    <TrendingUp size={14} className="text-foreground/20" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    <div className="p-2 border-t border-border/20 text-center">
                                        <p className="text-[10px] text-foreground/20">↑↓ Navigate • Enter Select • Esc Close</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Quote Panel */}
                <div className="lg:col-span-2">
                    {quoteLoading ? (
                        <div className="space-y-4">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : selectedStock && quote ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-8 space-y-8"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-4xl font-black">{selectedStock.replace('.NS', '').replace('.BO', '')}</h2>
                                    <p className="text-foreground/40 text-sm">{selectedStock}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-black text-primary">₹{quote.c?.toFixed(2)}</p>
                                    <p className={`font-bold flex items-center justify-end gap-1 ${quote.c >= quote.pc ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {quote.c >= quote.pc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {quote.c >= quote.pc ? '+' : ''}{(quote.c - quote.pc).toFixed(2)} ({((quote.c - quote.pc) / quote.pc * 100).toFixed(2)}%)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Open', value: quote.o },
                                    { label: 'High', value: quote.h },
                                    { label: 'Low', value: quote.l },
                                    { label: 'Prev Close', value: quote.pc }
                                ].map(({ label, value }) => (
                                    <div key={label} className="p-4 bg-background/50 rounded-xl">
                                        <p className="text-xs text-foreground/40">{label}</p>
                                        <p className="font-bold">₹{value?.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-background/30 p-6 rounded-2xl border border-border/20 space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold">Order Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-24 p-2.5 bg-card border border-border rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-primary"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        id="order-quantity-input"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-3 border-t border-border/20">
                                    <p className="text-foreground/50">Estimated Total</p>
                                    <p className="text-xl font-black">₹{(quote.c * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>

                                <AnimatePresence>
                                    {message.text && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`p-3 rounded-lg text-center font-medium text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        onClick={() => handleTrade('BUY')}
                                        className="py-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                                        id="buy-button"
                                    >
                                        BUY
                                    </button>
                                    <button
                                        onClick={() => handleTrade('SELL')}
                                        className="py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                                        id="sell-button"
                                    >
                                        SELL
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center glass-card text-foreground/30 space-y-4">
                            <Activity size={64} className="opacity-20 text-primary" />
                            <p className="text-xl font-medium">Select a stock to see market data</p>
                            <p className="text-sm text-foreground/20">Use the search bar to find stocks</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stocks;
