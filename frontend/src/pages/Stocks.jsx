import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Stocks = () => {
    const { user, setUser } = useAuth();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quote, setQuote] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!search) return;
        try {
            console.log('Searching for:', search);
            const res = await axios.get(`http://localhost:5000/api/stocks/search?q=${search}`);
            console.log('Search results:', res.data.result);
            setResults(res.data.result || []);
            if (res.data.result?.length === 0) {
                setMessage({ text: 'No results found for your search', type: 'error' });
            }
        } catch (err) {
            console.error('Search UI Error:', err);
            setMessage({ text: 'Search failed. Please try again.', type: 'error' });
        }
    };

    const getQuote = async (symbol) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/stocks/quote/${symbol}`);
            setQuote(res.data);
            setSelectedStock(symbol);
            setMessage({ text: '', type: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleTrade = async (type) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/trades/${type.toLowerCase()}`, {
                symbol: selectedStock,
                quantity: Number(quantity)
            });
            setMessage({ text: res.data.message, type: 'success' });
            setUser({ ...user, balance: res.data.balance });
            getQuote(selectedStock);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Trade failed', type: 'error' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Market</h1>
                <p className="text-foreground/60">Search and trade thousands of stocks</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Search symbol (e.g. RELIANCE)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-primary/5 font-bold">Search Results</div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {results.length === 0 ? (
                                <p className="p-8 text-center text-foreground/40">Enter a symbol to search</p>
                            ) : (
                                results.map((s) => (
                                    <button
                                        key={s.symbol}
                                        onClick={() => getQuote(s.symbol)}
                                        className={`w-full p-4 text-left hover:bg-background border-b border-border/50 transition-colors flex items-center justify-between ${selectedStock === s.symbol ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                    >
                                        <div>
                                            <p className="font-bold">{s.symbol}</p>
                                            <p className="text-xs text-foreground/60 truncate max-w-[150px]">{s.description}</p>
                                        </div>
                                        <TrendingUp size={16} className="text-green-500" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedStock && quote ? (
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-4xl font-black">{selectedStock}</h2>
                                    <p className="text-foreground/60">Real-time Quote</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-black text-primary">₹{quote.c.toFixed(2)}</p>
                                    <p className={`font-bold ${quote.c >= quote.pc ? 'text-green-500' : 'text-red-500'}`}>
                                        {quote.c >= quote.pc ? '+' : ''}{(quote.c - quote.pc).toFixed(2)} ({((quote.c - quote.pc) / quote.pc * 100).toFixed(2)}%)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-background rounded-xl">
                                    <p className="text-xs text-foreground/60">Open</p>
                                    <p className="font-bold">₹{quote.o.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-background rounded-xl">
                                    <p className="text-xs text-foreground/60">High</p>
                                    <p className="font-bold">₹{quote.h.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-background rounded-xl">
                                    <p className="text-xs text-foreground/60">Low</p>
                                    <p className="font-bold">₹{quote.l.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-background rounded-xl">
                                    <p className="text-xs text-foreground/60">Prev Close</p>
                                    <p className="font-bold">₹{quote.pc.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="bg-background/50 p-6 rounded-2xl border border-border space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold">Order Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-24 p-2 bg-card border border-border rounded-lg text-center font-bold"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border-t border-border/50">
                                    <p className="text-foreground/60">Estimated Total</p>
                                    <p className="text-xl font-black">₹{(quote.c * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>

                                {message.text && (
                                    <div className={`p-3 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        onClick={() => handleTrade('BUY')}
                                        className="py-4 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        BUY {selectedStock}
                                    </button>
                                    <button
                                        onClick={() => handleTrade('SELL')}
                                        className="py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        SELL {selectedStock}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center bg-card rounded-2xl border border-dashed border-border text-foreground/40 space-y-4">
                            <Activity size={64} className="opacity-20 text-primary" />
                            <p className="text-xl font-medium">Select a stock to see market data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stocks;
