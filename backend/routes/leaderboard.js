const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

router.get('/', async (req, res) => {
    try {
        // Fetch all users and their portfolios
        const users = await User.findAll({
            attributes: ['id', 'name', 'balance']
        });

        const portfolios = await Portfolio.findAll();

        // Calculate total worth for each user
        const results = users.map(user => {
            const userPortfolios = portfolios.filter(p => p.userId === user.id);
            const portfolioValue = userPortfolios.reduce((sum, p) => sum + (p.quantity * p.averagePrice), 0);
            const totalWorth = user.balance + portfolioValue;
            const initialCapital = 1000000;
            const profitPercent = ((totalWorth - initialCapital) / initialCapital) * 100;

            return {
                id: user.id,
                name: user.name,
                balance: user.balance,
                portfolioValue: parseFloat(portfolioValue.toFixed(2)),
                totalWorth: parseFloat(totalWorth.toFixed(2)),
                profitPercent: parseFloat(profitPercent.toFixed(2))
            };
        });

        // Sort by total worth descending
        results.sort((a, b) => b.totalWorth - a.totalWorth);

        res.json(results.slice(0, 10));
    } catch (err) {
        console.error('Leaderboard error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
