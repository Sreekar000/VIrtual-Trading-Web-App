const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const symbols = ['RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS'];

async function testQuotes() {
    try {
        console.log('Fetching quotes for:', symbols);
        // We need a token, but let's try calling the route directly if we can't get one easily.
        // Or we can just use the internal getLiveQuote and getMockQuote to see what they return.

        // Let's actually test the logic from stocks.js
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
