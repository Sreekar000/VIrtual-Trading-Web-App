const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const axios = require('axios');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

const basePrices = {
    'RELIANCE.NS': 2950, 'TCS.NS': 4100, 'HDFCBANK.NS': 1600, 'ICICIBANK.NS': 1050,
    'INFY.NS': 1650, 'BHARTIARTL.NS': 1180, 'SBI.NS': 750, 'LICI.NS': 920,
    'HINDUNILVR.NS': 2500, 'ITC.NS': 450, 'KOTAKBANK.NS': 1780, 'LT.NS': 3400,
    'AXISBANK.NS': 1120, 'WIPRO.NS': 480, 'HCLTECH.NS': 1550, 'TATAMOTORS.NS': 780,
    'MARUTI.NS': 10500, 'SUNPHARMA.NS': 1650, 'TITAN.NS': 3200, 'BAJFINANCE.NS': 6800,
    'ASIANPAINT.NS': 2900, 'NESTLEIND.NS': 2450, 'ULTRACEMCO.NS': 9800,
    'POWERGRID.NS': 280, 'NTPC.NS': 320, 'ONGC.NS': 260, 'TATASTEEL.NS': 145,
    'JSWSTEEL.NS': 880, 'ADANIENT.NS': 2900, 'ADANIPORTS.NS': 1250,
    'POLYCAB.NS': 5600, 'PNB.NS': 105, 'TECHM.NS': 1350, 'DRREDDY.NS': 5800,
    'CIPLA.NS': 1480, 'COALINDIA.NS': 390, 'BPCL.NS': 580, 'IOC.NS': 160,
    'HINDALCO.NS': 580, 'GRASIM.NS': 2350
};

const getISTTimestamp = () => {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + offset);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}+05:30`;
};

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
    const base = basePrices[symbol] || 1000;
    return parseFloat((base + (Math.random() * 10 - 5)).toFixed(2));
};

// Buy Stock
router.post('/buy', auth, async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        const price = await getPrice(symbol);
        const cost = price * quantity;
        const executedAt = getISTTimestamp();

        const user = await User.findByPk(req.user);
        if (user.balance < cost) return res.status(400).json({ message: 'Insufficient balance' });

        user.balance -= cost;
        await user.save();

        await Trade.create({ userId: user.id, stockSymbol: symbol, quantity, price, type: 'BUY', executedAt });

        let portfolio = await Portfolio.findOne({ where: { userId: user.id, stockSymbol: symbol } });
        if (portfolio) {
            const totalCost = (portfolio.quantity * portfolio.averagePrice) + cost;
            portfolio.quantity += quantity;
            portfolio.averagePrice = totalCost / portfolio.quantity;
            await portfolio.save();
        } else {
            await Portfolio.create({ userId: user.id, stockSymbol: symbol, quantity, averagePrice: price, firstBuyDate: executedAt });
        }

        res.json({ message: 'Purchase successful', balance: user.balance, executedAt });
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
        const executedAt = getISTTimestamp();

        const user = await User.findByPk(req.user);
        user.balance += revenue;
        await user.save();

        await Trade.create({ userId: user.id, stockSymbol: symbol, quantity, price, type: 'SELL', executedAt });

        portfolio.quantity -= quantity;
        if (portfolio.quantity === 0) {
            await portfolio.destroy();
        } else {
            await portfolio.save();
        }

        res.json({ message: 'Sale successful', balance: user.balance, executedAt });
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

// Get Stats - Lifetime performance metrics
router.get('/stats', auth, async (req, res) => {
    try {
        const trades = await Trade.findAll({
            where: { userId: req.user },
            order: [['createdAt', 'ASC']]
        });

        if (trades.length === 0) {
            return res.json({
                totalTrades: 0, realizedPnl: 0, winRate: 0,
                avgGain: 0, avgLoss: 0, bestTrade: null, worstTrade: null, totalBrokerage: 0
            });
        }

        const positions = {};
        let realizedPnl = 0;
        const completedTrades = [];

        for (const trade of trades) {
            const sym = trade.stockSymbol;
            if (!positions[sym]) positions[sym] = { qty: 0, avgPrice: 0 };

            if (trade.type === 'BUY') {
                const totalCost = (positions[sym].qty * positions[sym].avgPrice) + (trade.quantity * trade.price);
                positions[sym].qty += trade.quantity;
                positions[sym].avgPrice = positions[sym].qty > 0 ? totalCost / positions[sym].qty : 0;
            } else if (trade.type === 'SELL') {
                const profit = (trade.price - positions[sym].avgPrice) * trade.quantity;
                realizedPnl += profit;
                completedTrades.push({
                    symbol: sym, profit,
                    profitPercent: positions[sym].avgPrice > 0 ? (profit / (positions[sym].avgPrice * trade.quantity)) * 100 : 0,
                    date: trade.executedAt || trade.createdAt
                });
                positions[sym].qty -= trade.quantity;
            }
        }

        const wins = completedTrades.filter(t => t.profit > 0);
        const losses = completedTrades.filter(t => t.profit < 0);
        const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;
        const avgGain = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.profit, 0) / losses.length : 0;
        const sortedByProfit = [...completedTrades].sort((a, b) => b.profit - a.profit);
        const bestTrade = sortedByProfit.length > 0 ? sortedByProfit[0] : null;
        const worstTrade = sortedByProfit.length > 0 ? sortedByProfit[sortedByProfit.length - 1] : null;
        const totalBrokerage = trades.reduce((sum, t) => sum + (t.price * t.quantity * 0.0003), 0);
        const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgGain / avgLoss) : 0;
        const returns = completedTrades.map(t => t.profitPercent);
        const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
        const stdDev = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)) : 0;
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

        res.json({
            totalTrades: trades.length,
            realizedPnl: parseFloat(realizedPnl.toFixed(2)),
            winRate: parseFloat(winRate.toFixed(2)),
            avgGain: parseFloat(avgGain.toFixed(2)),
            avgLoss: parseFloat(avgLoss.toFixed(2)),
            bestTrade, worstTrade,
            totalBrokerage: parseFloat(totalBrokerage.toFixed(2)),
            riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
            completedTrades: completedTrades.map(t => ({
                ...t, profit: parseFloat(t.profit.toFixed(2)), profitPercent: parseFloat(t.profitPercent.toFixed(2))
            }))
        });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
