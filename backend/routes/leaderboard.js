const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
    try {
        const leaders = await User.findAll({
            order: [['balance', 'DESC']],
            limit: 10,
            attributes: ['id', 'name', 'balance']
        });
        res.json(leaders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
