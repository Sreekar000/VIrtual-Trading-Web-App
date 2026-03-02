import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

const History = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/trades/history');
            setTrades(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]">Loading History...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Transaction History</h1>
                    <p className="text-foreground/60">Review your past trades and performance</p>
                </div>
                <button className="p-2 rounded-lg bg-card border border-border hover:bg-background transition-colors">
                    <Filter size={20} />
                </button>
            </header>

            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-primary/5 border-b border-border">
                                <th className="p-4 font-bold">Type</th>
                                <th className="p-4 font-bold">Asset</th>
                                <th className="p-4 font-bold">Quantity</th>
                                <th className="p-4 font-bold">Price</th>
                                <th className="p-4 font-bold">Total</th>
                                <th className="p-4 font-bold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {trades.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-foreground/40">
                                        <HistoryIcon size={48} className="mx-auto mb-4 opacity-10" />
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                trades.map((trade) => (
                                    <tr key={trade._id} className="hover:bg-background transition-colors">
                                        <td className="p-4">
                                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${trade.type === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {trade.type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                <span>{trade.type}</span>
                                            </span>
                                        </td>
                                        <td className="p-4 font-black">{trade.stockSymbol}</td>
                                        <td className="p-4">{trade.quantity}</td>
                                        <td className="p-4">₹{trade.price.toFixed(2)}</td>
                                        <td className="p-4 font-bold">₹{(trade.price * trade.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4 text-right text-foreground/60 text-sm">
                                            {new Date(trade.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default History;
