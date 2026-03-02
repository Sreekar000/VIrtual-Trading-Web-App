const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Portfolio = sequelize.define('Portfolio', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stockSymbol: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    averagePrice: { type: DataTypes.FLOAT, defaultValue: 0 }
}, {
    indexes: [{ unique: true, fields: ['userId', 'stockSymbol'] }]
});

module.exports = Portfolio;
