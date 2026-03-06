const sequelize = require('./config/database');
const Portfolio = require('./models/Portfolio');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function fixPortfolios() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        const portfolios = await Portfolio.findAll();
        for (const p of portfolios) {
            try {
                const quote = await yahooFinance.quote(p.stockSymbol);
                if (quote && quote.regularMarketPrice) {
                    const realPrice = quote.regularMarketPrice;
                    // If my previous script artificially inflated averagePrice (e.g. 1599 for HDFCBANK when real is 870)
                    if (p.averagePrice > realPrice * 1.3 || p.averagePrice < realPrice * 0.7) {
                        console.log(`Fixing ${p.stockSymbol} for user ${p.userId}: ${p.averagePrice} -> ${realPrice}`);
                        p.averagePrice = realPrice;
                        await p.save();
                    }
                }
            } catch (e) {
                console.log(`Could not fetch real price for ${p.stockSymbol}`);
            }
        }
        console.log('Portfolio fix complete');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
fixPortfolios();
