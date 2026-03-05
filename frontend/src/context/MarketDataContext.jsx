import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config';

const MarketDataContext = createContext();

export const useMarketData = () => useContext(MarketDataContext);

export const MarketDataProvider = ({ children }) => {
    const { user } = useAuth();
    const [prices, setPrices] = useState({});
    const [subscriptions, setSubscriptions] = useState({}); // { symbol: Set([source1, source2]) }
    const intervalRef = useRef(null);

    const fetchBatchPrices = useCallback(async () => {
        const symbols = Object.keys(subscriptions).filter(s => subscriptions[s].size > 0);
        if (symbols.length === 0 || !user) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/stocks/quotes`, { symbols });

            setPrices(prevPrices => {
                const newPrices = { ...prevPrices };
                Object.keys(res.data).forEach(symbol => {
                    const newData = res.data[symbol];
                    const oldPrice = prevPrices[symbol]?.c;

                    newPrices[symbol] = {
                        ...newData,
                        prevFetch: oldPrice,
                        priceDirection: oldPrice ? (newData.c > oldPrice ? 'up' : newData.c < oldPrice ? 'down' : 'same') : 'same'
                    };
                });
                return newPrices;
            });
        } catch (err) {
            console.error('Market data fetch error:', err);
        }
    }, [subscriptions, user]);

    const subscribe = useCallback((symbol, source) => {
        if (!symbol) return;
        setSubscriptions(prev => {
            const next = { ...prev };
            if (!next[symbol]) next[symbol] = new Set();
            next[symbol].add(source);
            return next;
        });
    }, []);

    const unsubscribe = useCallback((symbol, source) => {
        if (!symbol) return;
        setSubscriptions(prev => {
            const next = { ...prev };
            if (next[symbol]) {
                next[symbol].delete(source);
                if (next[symbol].size === 0) {
                    delete next[symbol];
                }
            }
            return next;
        });
    }, []);

    // Polling logic
    useEffect(() => {
        if (user) {
            fetchBatchPrices();
            intervalRef.current = setInterval(fetchBatchPrices, 8000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, fetchBatchPrices]);

    return (
        <MarketDataContext.Provider value={{
            prices,
            subscribe,
            unsubscribe
        }}>
            {children}
        </MarketDataContext.Provider>
    );
};
