const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Watchlist = sequelize.define('Watchlist', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'My Watchlist' }
});

const WatchlistItem = sequelize.define('WatchlistItem', {
    watchlistId: { type: DataTypes.INTEGER, allowNull: false },
    stockSymbol: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING, allowNull: true }
});

Watchlist.hasMany(WatchlistItem, { foreignKey: 'watchlistId', onDelete: 'CASCADE' });
WatchlistItem.belongsTo(Watchlist, { foreignKey: 'watchlistId' });

module.exports = { Watchlist, WatchlistItem };
