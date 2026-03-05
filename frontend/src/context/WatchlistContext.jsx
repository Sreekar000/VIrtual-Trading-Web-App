import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useMarketData } from './MarketDataContext';

const WatchlistContext = createContext();

export const useWatchlist = () => useContext(WatchlistContext);

export const WatchlistProvider = ({ children }) => {
    const { user } = useAuth();
    const { prices, subscribe, unsubscribe } = useMarketData();
    const [watchlists, setWatchlists] = useState([]);
    const [activeWatchlistId, setActiveWatchlistId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchWatchlists = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axios.get('http://localhost:5000/api/watchlists');
            setWatchlists(res.data);
            if (!activeWatchlistId && res.data.length > 0) {
                setActiveWatchlistId(res.data[0].id);
            }
        } catch (err) {
            console.error('Watchlist fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [user, activeWatchlistId]);

    // Handle price subscriptions for active watchlist
    useEffect(() => {
        const activeWl = watchlists.find(w => w.id === activeWatchlistId);
        if (!activeWl || !activeWl.WatchlistItems) return;

        const symbols = activeWl.WatchlistItems.map(item => item.stockSymbol);
        symbols.forEach(symbol => subscribe(symbol, 'watchlist'));

        return () => {
            symbols.forEach(symbol => unsubscribe(symbol, 'watchlist'));
        };
    }, [watchlists, activeWatchlistId, subscribe, unsubscribe]);

    const createWatchlist = async (name) => {
        try {
            const res = await axios.post('http://localhost:5000/api/watchlists', { name });
            setWatchlists(prev => [...prev, res.data]);
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const renameWatchlist = async (id, name) => {
        try {
            await axios.put(`http://localhost:5000/api/watchlists/${id}`, { name });
            setWatchlists(prev => prev.map(w => w.id === id ? { ...w, name } : w));
        } catch { /* skip */ }
    };

    const deleteWatchlist = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/watchlists/${id}`);
            setWatchlists(prev => prev.filter(w => w.id !== id));
            if (activeWatchlistId === id) {
                const remaining = watchlists.filter(w => w.id !== id);
                setActiveWatchlistId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch { /* skip */ }
    };

    const addToWatchlist = async (watchlistId, stockSymbol, companyName) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/watchlists/${watchlistId}/items`, { stockSymbol, companyName });
            setWatchlists(prev => prev.map(w => w.id === watchlistId
                ? { ...w, WatchlistItems: [...(w.WatchlistItems || []), res.data] }
                : w
            ));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Failed to add' };
        }
    };

    const removeFromWatchlist = async (watchlistId, itemId) => {
        try {
            await axios.delete(`http://localhost:5000/api/watchlists/${watchlistId}/items/${itemId}`);
            setWatchlists(prev => prev.map(w => w.id === watchlistId
                ? { ...w, WatchlistItems: (w.WatchlistItems || []).filter(i => i.id !== itemId) }
                : w
            ));
        } catch { /* skip */ }
    };

    useEffect(() => {
        if (user) fetchWatchlists();
    }, [user, fetchWatchlists]);

    return (
        <WatchlistContext.Provider value={{
            watchlists, activeWatchlistId, setActiveWatchlistId,
            watchlistPrices: prices, loading,
            createWatchlist, renameWatchlist, deleteWatchlist,
            addToWatchlist, removeFromWatchlist, refreshWatchlists: fetchWatchlists
        }}>
            {children}
        </WatchlistContext.Provider>
    );
};
