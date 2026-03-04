const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trade = sequelize.define('Trade', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stockSymbol: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    type: { type: DataTypes.ENUM('BUY', 'SELL'), allowNull: false },
    executedAt: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: () => {
            return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T') + '+05:30';
        }
    }
});

module.exports = Trade;
