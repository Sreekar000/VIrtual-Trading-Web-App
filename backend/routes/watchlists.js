const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Watchlist, WatchlistItem } = require('../models/Watchlist');

// Get all watchlists for user
router.get('/', auth, async (req, res) => {
    try {
        let watchlists = await Watchlist.findAll({
            where: { userId: req.user },
            include: [{ model: WatchlistItem }],
            order: [['createdAt', 'ASC']]
        });

        // Create default watchlist if none exists
        if (watchlists.length === 0) {
            const defaultWl = await Watchlist.create({ userId: req.user, name: 'My Watchlist' });
            watchlists = [{ ...defaultWl.toJSON(), WatchlistItems: [] }];
        }

        res.json(watchlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new watchlist
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const watchlist = await Watchlist.create({ userId: req.user, name: name || 'New Watchlist' });
        res.json({ ...watchlist.toJSON(), WatchlistItems: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rename watchlist
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, userId: req.user } });
        if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

        watchlist.name = name;
        await watchlist.save();
        res.json(watchlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete watchlist
router.delete('/:id', auth, async (req, res) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, userId: req.user } });
        if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

        await watchlist.destroy();
        res.json({ message: 'Watchlist deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add stock to watchlist
router.post('/:id/items', auth, async (req, res) => {
    try {
        const { stockSymbol, companyName } = req.body;
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, userId: req.user } });
        if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

        // Check duplicate
        const existing = await WatchlistItem.findOne({ where: { watchlistId: watchlist.id, stockSymbol } });
        if (existing) return res.status(400).json({ message: 'Stock already in watchlist' });

        const item = await WatchlistItem.create({ watchlistId: watchlist.id, stockSymbol, companyName });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove stock from watchlist
router.delete('/:id/items/:itemId', auth, async (req, res) => {
    try {
        const watchlist = await Watchlist.findOne({ where: { id: req.params.id, userId: req.user } });
        if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });

        const item = await WatchlistItem.findOne({ where: { id: req.params.itemId, watchlistId: watchlist.id } });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        await item.destroy();
        res.json({ message: 'Stock removed from watchlist' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
