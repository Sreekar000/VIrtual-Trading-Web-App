const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trade = sequelize.define('Trade', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stockSymbol: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    type: { type: DataTypes.ENUM('BUY', 'SELL'), allowNull: false }
});

module.exports = Trade;
