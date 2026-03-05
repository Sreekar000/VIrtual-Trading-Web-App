const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const path = require('path');

// Serve Static Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const sequelize = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/watchlists', require('./routes/watchlists'));

// Handle SPA
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API Route Not Found' });
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

sequelize.sync()
    .then(() => {
        console.log('Database Connected & Synced');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log(err));
