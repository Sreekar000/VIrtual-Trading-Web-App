const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const quote = await yahooFinance.quote('RELIANCE.NS');
        console.log('Success:', quote.symbol, quote.regularMarketPrice);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
