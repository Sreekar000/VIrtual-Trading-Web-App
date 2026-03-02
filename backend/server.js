const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const sequelize = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Placeholder for other routes
app.get('/', (req, res) => res.send('VirtualTrade Pro API Running'));

const PORT = process.env.PORT || 5000;

sequelize.sync()
    .then(() => {
        console.log('Database Connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log(err));
