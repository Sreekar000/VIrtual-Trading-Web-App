import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { usePortfolio } from './PortfolioContext';

const TradeContext = createContext();

export const useTrade = () => useContext(TradeContext);

export const TradeProvider = ({ children }) => {
    const { user, setUser } = useAuth();
    const { refreshPortfolio, refreshStats } = usePortfolio();
    const [tradeHistory, setTradeHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const executeTrade = useCallback(async (type, symbol, quantity) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/trades/${type.toLowerCase()}`, {
                symbol,
                quantity: Number(quantity)
            });
            if (user) setUser({ ...user, balance: res.data.balance });
            // Refresh portfolio and stats after trade
            await refreshPortfolio(true);
            await refreshStats();
            return { success: true, message: res.data.message, balance: res.data.balance };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Trade failed' };
        }
    }, [user, setUser, refreshPortfolio, refreshStats]);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/trades/history');
            setTradeHistory(res.data);
        } catch (err) {
            console.error('History fetch error:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    return (
        <TradeContext.Provider value={{
            tradeHistory,
            historyLoading,
            executeTrade,
            fetchHistory
        }}>
            {children}
        </TradeContext.Provider>
    );
};
