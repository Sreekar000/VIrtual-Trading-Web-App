const symbols = ['RELIANCE.NS', 'TCS.NS', 'ZOMATO.NS'];
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function pollAPI() {
    console.log(`Polling Yahoo Finance API every 3s...`);
    
    // Initial fetch
    for (let iteration = 0; iteration < 4; iteration++) {
        const time = new Date().toLocaleTimeString();
        for (const sym of symbols) {
            try {
                const quote = await yahooFinance.quote(sym);
                console.log(`[${time}] ${sym}: ${quote.regularMarketPrice}`);
            } catch (e) {
                console.log(`[${time}] ${sym}: ERROR - ${e.message}`);
            }
        }
        console.log('---');
        if (iteration < 3) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

pollAPI();
