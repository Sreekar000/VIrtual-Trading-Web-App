const symbols = ['RELIANCE.NS', 'TCS.NS', 'ZOMATO.NS'];

async function pollAPI() {
    const YahooFinance = require('yahoo-finance2').default;
    const yahooFinance = new YahooFinance();

    console.log(`Polling Yahoo Finance API every 3s...`);

    setInterval(async () => {
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
    }, 3000);
}

pollAPI();
