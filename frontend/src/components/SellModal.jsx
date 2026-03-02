import React, { useState } from 'react';
import { X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SellModal = ({ stock, onClose, onSell }) => {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!stock) return null;

    const maxQty = stock.quantity;
    const estimatedProceeds = (stock.currentPrice * quantity).toFixed(2);
    const estimatedPnl = ((stock.currentPrice - stock.averagePrice) * quantity).toFixed(2);
    const isProfitable = parseFloat(estimatedPnl) >= 0;

    const handleSell = async () => {
        if (quantity <= 0 || quantity > maxQty) {
            setError('Invalid quantity');
            return;
        }
        setLoading(true);
        setError('');
        const result = await onSell(stock.stockSymbol, quantity);
        setLoading(false);
        if (result.success) {
            onClose();
        } else {
            setError(result.message);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glass-card p-6 w-full max-w-md space-y-5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black">Sell {stock.stockSymbol.replace('.NS', '')}</h3>
                            <p className="text-sm text-foreground/50">Holding: {maxQty} shares</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-background transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/50 p-3 rounded-xl">
                            <p className="text-xs text-foreground/50">Avg. Buy Price</p>
                            <p className="font-bold">₹{stock.averagePrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-background/50 p-3 rounded-xl">
                            <p className="text-xs text-foreground/50">Current Price</p>
                            <p className="font-bold text-primary">₹{stock.currentPrice.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Quantity to sell</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2 rounded-lg bg-background hover:bg-border transition-colors"
                            >
                                <Minus size={16} />
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={maxQty}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="flex-1 p-3 bg-background border border-border rounded-xl text-center font-bold text-lg outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                                className="p-2 rounded-lg bg-background hover:bg-border transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {[
                                { label: '25%', val: Math.max(1, Math.floor(maxQty * 0.25)) },
                                { label: '50%', val: Math.max(1, Math.floor(maxQty * 0.5)) },
                                { label: '75%', val: Math.max(1, Math.floor(maxQty * 0.75)) },
                                { label: 'All', val: maxQty }
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setQuantity(preset.val)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${quantity === preset.val ? 'bg-primary text-white' : 'bg-background hover:bg-border text-foreground/60'}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-background/50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-foreground/60">Estimated Proceeds</span>
                            <span className="font-bold">₹{parseFloat(estimatedProceeds).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-foreground/60">Estimated P&L</span>
                            <span className={`font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isProfitable ? '+' : ''}₹{parseFloat(estimatedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleSell}
                        disabled={loading}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            `SELL ${quantity} Share${quantity > 1 ? 's' : ''}`
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SellModal;
