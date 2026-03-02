import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider = ({ children }) => {
    const { user, setUser } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
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
    const intervalRef = useRef(null);

    const fetchPortfolio = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/trades/portfolio');
            const portfolioData = res.data;

            let currentTotalValue = 0;
            let totalInvested = 0;
            let dayChange = 0;

            const enrichedPortfolio = await Promise.all(portfolioData.map(async (item) => {
                try {
                    const quoteRes = await axios.get(`http://localhost:5000/api/stocks/quote/${item.stockSymbol}`);
                    const quote = quoteRes.data;
                    const currentPrice = quote.c;
                    const value = currentPrice * item.quantity;
                    const invested = item.averagePrice * item.quantity;
                    const profit = value - invested;
                    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
                    const itemDayChange = (quote.d || 0) * item.quantity;

                    currentTotalValue += value;
                    totalInvested += invested;
                    dayChange += itemDayChange;

                    return {
                        ...item,
                        currentPrice,
                        value,
                        profit,
                        profitPercent,
                        dayChange: itemDayChange,
                        dayChangePercent: quote.dp || 0,
                        open: quote.o,
                        high: quote.h,
                        low: quote.l,
                        prevClose: quote.pc
                    };
                } catch {
                    return { ...item, currentPrice: item.averagePrice, value: item.averagePrice * item.quantity, profit: 0, profitPercent: 0 };
                }
            }));

            const profit = currentTotalValue - totalInvested;
            const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
            const dayChangePercent = currentTotalValue > 0 ? (dayChange / currentTotalValue) * 100 : 0;

            setPortfolio(enrichedPortfolio);
            setStats({
                totalValue: currentTotalValue + (user?.balance || 0),
                totalInvested,
                currentValue: currentTotalValue,
                profit,
                profitPercent,
                dayChange,
                dayChangePercent
            });
        } catch (err) {
            console.error('Portfolio fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

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

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchPortfolio();
            fetchLifetimeStats();
        }
    }, [user, fetchPortfolio, fetchLifetimeStats]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (user) {
            intervalRef.current = setInterval(() => {
                fetchPortfolio(true);
            }, 10000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, fetchPortfolio]);

    return (
        <PortfolioContext.Provider value={{
            portfolio,
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
