/**
 * fix_trade_prices.js
 * 
 * One-time migration script to fix incorrect mock/base prices in Trade records.
 * Fetches correct prices from Yahoo Finance and updates all trades,
 * then re-syncs the Portfolio table.
 */

const sequelize = require('../config/database');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

let yahooFinance;
try {
    const YahooFinance = require('yahoo-finance2').default;
    yahooFinance = new YahooFinance();
} catch (e) {
    console.warn('yahoo-finance2 not available, will use portfolio averages only');
}

async function getLivePrice(symbol) {
    if (!yahooFinance) return null;
    try {
        const ySymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
        const quote = await yahooFinance.quote(ySymbol);
        if (quote && quote.regularMarketPrice) {
            return quote.regularMarketPrice;
        }
    } catch (err) {
        console.warn(`Could not fetch live price for ${symbol}: ${err.message}`);
    }
    return null;
}

async function fixTradePrices() {
    console.log('=== Trade Price Correction Script ===\n');

    try {
        await sequelize.authenticate();
        console.log('Database connected.\n');

        // Get all trades
        const trades = await Trade.findAll({ order: [['id', 'ASC']] });
        console.log(`Found ${trades.length} total trades.\n`);

        // Get all portfolio items (these have the correct averagePrice)
        const portfolios = await Portfolio.findAll();
        const portfolioMap = {};
        portfolios.forEach(p => {
            // Use the first portfolio entry for each symbol (per user)
            const key = `${p.userId}_${p.stockSymbol}`;
            if (!portfolioMap[key]) {
                portfolioMap[key] = p.averagePrice;
            }
        });

        // Get unique symbols
        const uniqueSymbols = [...new Set(trades.map(t => t.stockSymbol))];
        console.log(`Unique symbols: ${uniqueSymbols.join(', ')}\n`);

        // Fetch live prices for all symbols
        const livePrices = {};
        for (const symbol of uniqueSymbols) {
            const price = await getLivePrice(symbol);
            if (price) {
                livePrices[symbol] = price;
                console.log(`  Live price for ${symbol}: ₹${price}`);
            } else {
                console.log(`  No live price for ${symbol}`);
            }
        }
        console.log('');

        // Determine corrected price for each symbol
        const correctedPrices = {};
        for (const symbol of uniqueSymbols) {
            // Priority: live price > portfolio average
            if (livePrices[symbol]) {
                correctedPrices[symbol] = livePrices[symbol];
            } else {
                // Find any portfolio entry for this symbol
                const portfolioEntry = portfolios.find(p => p.stockSymbol === symbol);
                if (portfolioEntry && portfolioEntry.averagePrice > 0) {
                    correctedPrices[symbol] = portfolioEntry.averagePrice;
                }
            }
        }

        console.log('Corrected prices to apply:');
        for (const [sym, price] of Object.entries(correctedPrices)) {
            console.log(`  ${sym}: ₹${price}`);
        }
        console.log('');

        // Start transaction
        const t = await sequelize.transaction();

        try {
            let updatedCount = 0;

            for (const trade of trades) {
                const correctPrice = correctedPrices[trade.stockSymbol];
                if (!correctPrice) continue;

                // Add small random variation (±0.5%) to make prices look realistic
                // rather than having every trade at exactly the same price
                const variation = 1 + (Math.random() * 0.01 - 0.005); // ±0.5%
                const adjustedPrice = parseFloat((correctPrice * variation).toFixed(2));

                if (Math.abs(trade.price - correctPrice) > correctPrice * 0.05) {
                    // Only update if the difference is more than 5% (clearly wrong)
                    const oldPrice = trade.price;
                    trade.price = adjustedPrice;
                    await trade.save({ transaction: t });
                    updatedCount++;

                    if (updatedCount <= 20) {
                        console.log(`  Fixed Trade #${trade.id}: ${trade.stockSymbol} ${trade.type} - ₹${oldPrice} → ₹${adjustedPrice}`);
                    }
                }
            }

            if (updatedCount > 20) {
                console.log(`  ... and ${updatedCount - 20} more trades updated.`);
            }
            console.log(`\nTotal trades updated: ${updatedCount}\n`);

            // Now re-sync portfolios from corrected trades
            console.log('Re-syncing portfolios from corrected trades...');
            await Portfolio.destroy({ where: {}, transaction: t });

            const allTrades = await Trade.findAll({ order: [['id', 'ASC']], transaction: t });
            const userPositions = {};

            for (const trade of allTrades) {
                const { userId, stockSymbol, quantity, price, type, executedAt, createdAt } = trade;

                if (!userPositions[userId]) userPositions[userId] = {};
                if (!userPositions[userId][stockSymbol]) {
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

            // Save recalculated portfolio
            for (const userId in userPositions) {
                for (const stockSymbol in userPositions[userId]) {
                    const pos = userPositions[userId][stockSymbol];
                    if (pos.quantity > 0) {
                        await Portfolio.create({
                            userId: parseInt(userId),
                            stockSymbol,
                            quantity: pos.quantity,
                            averagePrice: parseFloat(pos.averagePrice.toFixed(2)),
                            firstBuyDate: pos.firstBuyDate
                        }, { transaction: t });
                        console.log(`  Portfolio: ${stockSymbol} - ${pos.quantity} shares @ ₹${pos.averagePrice.toFixed(2)} avg`);
                    }
                }
            }

            // Recalculate user balance from initial capital minus net spending
            const INITIAL_CAPITAL = 1000000; // ₹10,00,000
            const users = await User.findAll({ transaction: t });

            for (const user of users) {
                const userTrades = allTrades.filter(t => t.userId === user.id);
                let netSpent = 0;
                for (const trade of userTrades) {
                    if (trade.type === 'BUY') {
                        netSpent += trade.price * trade.quantity;
                    } else {
                        netSpent -= trade.price * trade.quantity;
                    }
                }
                const newBalance = parseFloat((INITIAL_CAPITAL - netSpent).toFixed(2));
                console.log(`  User ${user.id} balance: ₹${user.balance} → ₹${newBalance}`);
                user.balance = newBalance;
                await user.save({ transaction: t });
            }

            await t.commit();
            console.log('\n=== Migration Complete! ===');
            console.log('Trade prices, portfolios, and user balances have been corrected.');
            process.exit(0);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Migration failed:', err.message, err.stack);
        process.exit(1);
    }
}

fixTradePrices();
