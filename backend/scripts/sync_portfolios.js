const sequelize = require('../config/database');
const Trade = require('../models/Trade');
const PortfolioModel = require('../models/Portfolio');
const UserModel = require('../models/User');

async function syncPortfolios() {
    console.log('Starting Portfolio Synchronization...');

    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const t = await sequelize.transaction();

        try {
            // Clear existing portfolios
            await PortfolioModel.destroy({ where: {}, transaction: t });
            console.log('Cleared existing portfolios.');

            // Get all trades
            const trades = await Trade.findAll({ order: [['id', 'ASC']], transaction: t });
            console.log(`Processing ${trades.length} trades...`);

            const userPositions = {};

            for (const trade of trades) {
                const { userId, stockSymbol, quantity, price, type, executedAt, createdAt } = trade;

                if (!userPositions[userId]) userPositions[userId] = {};
                if (!userPositions[userId][stockSymbol]) {
                    // Ensure we get a string for the date
                    let dateStr = executedAt;
                    if (!dateStr || typeof dateStr !== 'string') {
                        dateStr = createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
                    }

                    userPositions[userId][stockSymbol] = {
                        quantity: 0,
                        averagePrice: 0,
                        firstBuyDate: dateStr
                    };
                }

                const pos = userPositions[userId][stockSymbol];

                if (type === 'BUY') {
                    const currentTotalCost = pos.quantity * pos.averagePrice;
                    const newTotalCost = currentTotalCost + (quantity * price);
                    pos.quantity += quantity;
                    pos.averagePrice = pos.quantity > 0 ? newTotalCost / pos.quantity : 0;
                } else if (type === 'SELL') {
                    pos.quantity -= quantity;
                    if (pos.quantity <= 0) {
                        pos.quantity = 0;
                        pos.averagePrice = 0;
                    }
                }
            }

            // Save new portfolio states
            for (const userId in userPositions) {
                for (const stockSymbol in userPositions[userId]) {
                    const pos = userPositions[userId][stockSymbol];
                    if (pos.quantity > 0) {
                        await PortfolioModel.create({
                            userId: parseInt(userId),
                            stockSymbol,
                            quantity: pos.quantity,
                            averagePrice: pos.averagePrice,
                            firstBuyDate: pos.firstBuyDate
                        }, { transaction: t });
                        console.log(`Created portfolio for User ${userId}: ${pos.quantity} shares of ${stockSymbol}`);
                    }
                }
            }

            // Fix User 1 Balance specifically
            const user1 = await UserModel.findByPk(1, { transaction: t });
            if (user1) {
                // Calculated deficit is 900,000
                user1.balance += 900000;
                await user1.save({ transaction: t });
                console.log(`Updated User 1 (Fix User) balance to ₹${user1.balance}`);
            }

            await t.commit();
            console.log('Portfolio Synchronization and Balance Fix Complete!');
            process.exit(0);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

syncPortfolios();
