import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useMarketData } from './MarketDataContext';

const PortfolioContext = createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = ({ children }) => {
    const { user, setUser } = useAuth();
    const { prices, subscribe, unsubscribe } = useMarketData();
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [stats, setStats] = useState({
        totalValue: 0,
        totalInvested: 0,
        profit: 0,
        profitPercent: 0,
        dayChange: 0,
        dayChangePercent: 0
    });
    const [lifetimeStats, setLifetimeStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPortfolio = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/trades/portfolio');
            setPortfolioItems(res.data);
        } catch (err) {
            console.error('Portfolio fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Handle price subscriptions for portfolio items
    useEffect(() => {
        if (!portfolioItems.length) return;
        const symbols = portfolioItems.map(item => item.stockSymbol);
        symbols.forEach(symbol => subscribe(symbol, 'portfolio'));

        return () => {
            symbols.forEach(symbol => unsubscribe(symbol, 'portfolio'));
        };
    }, [portfolioItems, subscribe, unsubscribe]);

    // Reactively compute enriched portfolio and stats when prices OR items change
    useEffect(() => {
        if (!portfolioItems.length) {
            setStats(prev => ({ ...prev, totalValue: user?.balance || 0, totalInvested: 0, profit: 0, profitPercent: 0 }));
            return;
        }

        let currentTotalValue = 0;
        let totalInvested = 0;
        let dayChange = 0;

        portfolioItems.forEach(item => {
            const quote = prices[item.stockSymbol];
            const currentPrice = quote?.c || item.averagePrice;
            const value = currentPrice * item.quantity;
            const invested = item.averagePrice * item.quantity;
            const itemDayChange = (quote?.d || 0) * item.quantity;

            currentTotalValue += value;
            totalInvested += invested;
            dayChange += itemDayChange;
        });

        const profit = currentTotalValue - totalInvested;
        const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
        const dayChangePercent = currentTotalValue > 0 ? (dayChange / currentTotalValue) * 100 : 0;

        setStats({
            totalValue: currentTotalValue + (user?.balance || 0),
            totalInvested,
            currentValue: currentTotalValue,
            profit,
            profitPercent,
            dayChange,
            dayChangePercent
        });
    }, [portfolioItems, prices, user?.balance]);

    // Create a computed portfolio array for consumption by UI components
    const enrichedPortfolio = React.useMemo(() => {
        return portfolioItems.map(item => {
            const quote = prices[item.stockSymbol];
            const currentPrice = quote?.c || item.averagePrice;
            const value = currentPrice * item.quantity;
            const invested = item.averagePrice * item.quantity;
            const profit = value - invested;
            const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

            return {
                ...item,
                currentPrice,
                value,
                profit,
                profitPercent,
                dayChange: (quote?.d || 0) * item.quantity,
                dayChangePercent: quote?.dp || 0,
                open: quote?.o,
                high: quote?.h,
                low: quote?.l,
                prevClose: quote?.pc
            };
        });
    }, [portfolioItems, prices]);

    const fetchLifetimeStats = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axios.get('http://localhost:5000/api/trades/stats');
            setLifetimeStats(res.data);
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    }, [user]);

    const sellStock = async (symbol, quantity) => {
        try {
            const res = await axios.post('http://localhost:5000/api/trades/sell', { symbol, quantity: Number(quantity) });
            if (user) setUser({ ...user, balance: res.data.balance });
            await fetchPortfolio(true);
            await fetchLifetimeStats();
            return { success: true, message: res.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Sale failed' };
        }
    };

    useEffect(() => {
        if (user) {
            fetchPortfolio();
            fetchLifetimeStats();
        }
    }, [user, fetchPortfolio, fetchLifetimeStats]);

    return (
        <PortfolioContext.Provider value={{
            portfolio: enrichedPortfolio,
            stats,
            lifetimeStats,
            loading,
            refreshPortfolio: fetchPortfolio,
            refreshStats: fetchLifetimeStats,
            sellStock
        }}>
            {children}
        </PortfolioContext.Provider>
    );
};
