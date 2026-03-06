const symbols = ['RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS'];

async function testQuotes() {
    try {
        console.log('Fetching quotes for:', symbols);
        const YahooFinance = require('yahoo-finance2').default;
        const yahooFinance = new YahooFinance();

        for (const symbol of symbols) {
            console.log(`\n--- ${symbol} ---`);
            try {
                const quote = await yahooFinance.quote(symbol);
                console.log('Yahoo Finance Quote:', quote.regularMarketPrice, quote.regularMarketChange);
            } catch (err) {
                console.error('Yahoo Finance Error:', err.message);
            }
        }
    } catch (err) {
        console.error('Test Error:', err.message);
    }
}

testQuotes();
