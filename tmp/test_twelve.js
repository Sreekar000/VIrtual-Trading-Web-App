const TWELVE_DATA_API_KEY = '16232b4826444d0cbaf2c36d2d96c83b';
const symbols = ['RELIANCE:NSE', 'HDFCBANK:NSE', 'TCS:NSE'];

async function testTwelveData() {
    try {
        const symbolStr = 'RELIANCE:NSE,HDFCBANK:NSE,TCS:NSE';
        const url = `https://api.twelvedata.com/quote?symbol=${symbolStr}&apikey=${TWELVE_DATA_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        console.log('Twelve Data Quote Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

testTwelveData();
