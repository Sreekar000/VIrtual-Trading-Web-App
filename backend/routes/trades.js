const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const axios = require('axios');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

const getPrice = async (symbol) => {
    try {
        if (!API_KEY || API_KEY === 'your_finnhub_api_key_here') return getMockPrice(symbol);
        const res = await axios.get(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
        if (res.data.c === 0) return getMockPrice(symbol);
        return res.data.c;
    } catch (err) {
        console.warn(`Trade price API failure for ${symbol}, using mock.`);
        return getMockPrice(symbol);
    }
};

const getMockPrice = (symbol) => {
    const basePrices = { 'RELIANCE.NS': 2950, 'TCS.NS': 4100, 'HDFCBANK.NS': 1600, 'INFY.NS': 1650, 'SBI.NS': 750 };
    return (basePrices[symbol] || 1000) + (Math.random() * 10 - 5);
};

// Buy Stock
router.post('/buy', auth, async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        const price = await getPrice(symbol);
        const cost = price * quantity;

        const user = await User.findByPk(req.user);
        if (user.balance < cost) return res.status(400).json({ message: 'Insufficient balance' });

        // Update balance
        user.balance -= cost;
        await user.save();

        // Record trade
        await Trade.create({ userId: user.id, stockSymbol: symbol, quantity, price, type: 'BUY' });

        // Update portfolio
        let portfolio = await Portfolio.findOne({ where: { userId: user.id, stockSymbol: symbol } });
        if (portfolio) {
            const totalCost = (portfolio.quantity * portfolio.averagePrice) + cost;
            portfolio.quantity += quantity;
            portfolio.averagePrice = totalCost / portfolio.quantity;
            await portfolio.save();
        } else {
            await Portfolio.create({ userId: user.id, stockSymbol: symbol, quantity, averagePrice: price });
        }

        res.json({ message: 'Purchase successful', balance: user.balance });
    } catch (err) {
        console.error('Trade error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Sell Stock
router.post('/sell', auth, async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        const portfolio = await Portfolio.findOne({ where: { userId: req.user, stockSymbol: symbol } });

        if (!portfolio || portfolio.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock quantity' });
        }

        const price = await getPrice(symbol);
        const revenue = price * quantity;

        const user = await User.findByPk(req.user);
        user.balance += revenue;
        await user.save();

        // Record trade
        await Trade.create({ userId: user.id, stockSymbol: symbol, quantity, price, type: 'SELL' });

        // Update portfolio
        portfolio.quantity -= quantity;
        if (portfolio.quantity === 0) {
            await portfolio.destroy();
        } else {
            await portfolio.save();
        }

        res.json({ message: 'Sale successful', balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Portfolio
router.get('/portfolio', auth, async (req, res) => {
    try {
        const portfolio = await Portfolio.findAll({ where: { userId: req.user } });
        res.json(portfolio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get History
router.get('/history', auth, async (req, res) => {
    try {
        const trades = await Trade.findAll({
            where: { userId: req.user },
            order: [['createdAt', 'DESC']]
        });
        res.json(trades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
