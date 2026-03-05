import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { SkeletonRow } from './LoadingSkeleton';
import SellModal from './SellModal';
import { Link } from 'react-router-dom';

const PositionsPanel = () => {
    const { portfolio, loading, sellStock } = usePortfolio();
    const [sellTarget, setSellTarget] = useState(null);

    if (loading) {
        return (
            <div className="space-y-1 px-2 py-2">
                <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Positions</p>
                </div>
                {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
        );
    }

    if (portfolio.length === 0) {
        return (
            <div className="px-3 py-3">
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-2">Positions</p>
                <div className="text-center py-4">
                    <p className="text-xs text-foreground/30">No open positions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-2 py-2">
            <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">
                    Positions ({portfolio.length})
                </p>
                <Link to="/positions" className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                    Details <ChevronRight size={12} />
                </Link>
            </div>

            <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                {portfolio.map((item) => {
                    const isProfitable = item.profit >= 0;
                    return (
                        <div
                            key={item.stockSymbol}
                            className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-background/60 transition-all cursor-default"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm truncate">{item.stockSymbol.replace('.NS', '')}</p>
                                    {isProfitable ? (
                                        <TrendingUp size={12} className="text-emerald-400 flex-shrink-0" />
                                    ) : (
                                        <TrendingDown size={12} className="text-red-400 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                                    <span>{item.quantity} shares</span>
                                    <span className="opacity-30">•</span>
                                    <span>₹{item.averagePrice?.toFixed(2)} avg</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className={`text-xs font-bold transition-colors duration-500 ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isProfitable ? '+' : ''}₹{item.profit?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className={`text-[10px] ${isProfitable ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                        {isProfitable ? '+' : ''}{item.profitPercent?.toFixed(1)}%
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSellTarget(item); }}
                                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-all"
                                >
                                    SELL
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

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

export default PositionsPanel;
