const FINNHUB_API_KEY = 'd6iho0hr01qm7dc7i7hgd6iho0hr01qm7dc7i7i0';

async function testFinnhub() {
    try {
        const symbol = 'RELIANCE.NS'; // Finnhub uses .NS for NSE
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        console.log('Finnhub Quote Response for', symbol, ':', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

testFinnhub();
