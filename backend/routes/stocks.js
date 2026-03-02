const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

// Expanded mock data with ~30 popular Indian stocks
const indianStocksMock = [
    { symbol: 'RELIANCE.NS', description: 'RELIANCE INDUSTRIES LTD', type: 'Common Stock' },
    { symbol: 'TCS.NS', description: 'TATA CONSULTANCY SERVICES LTD', type: 'Common Stock' },
    { symbol: 'HDFCBANK.NS', description: 'HDFC BANK LTD', type: 'Common Stock' },
    { symbol: 'ICICIBANK.NS', description: 'ICICI BANK LTD', type: 'Common Stock' },
    { symbol: 'INFY.NS', description: 'INFOSYS LTD', type: 'Common Stock' },
    { symbol: 'BHARTIARTL.NS', description: 'BHARTI AIRTEL LTD', type: 'Common Stock' },
    { symbol: 'SBI.NS', description: 'STATE BANK OF INDIA', type: 'Common Stock' },
    { symbol: 'LICI.NS', description: 'LIFE INSURANCE CORP OF INDIA', type: 'Common Stock' },
    { symbol: 'HINDUNILVR.NS', description: 'HINDUSTAN UNILEVER LTD', type: 'Common Stock' },
    { symbol: 'ITC.NS', description: 'ITC LTD', type: 'Common Stock' },
    { symbol: 'KOTAKBANK.NS', description: 'KOTAK MAHINDRA BANK LTD', type: 'Common Stock' },
    { symbol: 'LT.NS', description: 'LARSEN & TOUBRO LTD', type: 'Common Stock' },
    { symbol: 'AXISBANK.NS', description: 'AXIS BANK LTD', type: 'Common Stock' },
    { symbol: 'WIPRO.NS', description: 'WIPRO LTD', type: 'Common Stock' },
    { symbol: 'HCLTECH.NS', description: 'HCL TECHNOLOGIES LTD', type: 'Common Stock' },
    { symbol: 'TATAMOTORS.NS', description: 'TATA MOTORS LTD', type: 'Common Stock' },
    { symbol: 'MARUTI.NS', description: 'MARUTI SUZUKI INDIA LTD', type: 'Common Stock' },
    { symbol: 'SUNPHARMA.NS', description: 'SUN PHARMACEUTICAL IND LTD', type: 'Common Stock' },
    { symbol: 'TITAN.NS', description: 'TITAN COMPANY LTD', type: 'Common Stock' },
    { symbol: 'BAJFINANCE.NS', description: 'BAJAJ FINANCE LTD', type: 'Common Stock' },
    { symbol: 'ASIANPAINT.NS', description: 'ASIAN PAINTS LTD', type: 'Common Stock' },
    { symbol: 'NESTLEIND.NS', description: 'NESTLE INDIA LTD', type: 'Common Stock' },
    { symbol: 'ULTRACEMCO.NS', description: 'ULTRATECH CEMENT LTD', type: 'Common Stock' },
    { symbol: 'POWERGRID.NS', description: 'POWER GRID CORP OF INDIA LTD', type: 'Common Stock' },
    { symbol: 'NTPC.NS', description: 'NTPC LTD', type: 'Common Stock' },
    { symbol: 'ONGC.NS', description: 'OIL AND NATURAL GAS CORP LTD', type: 'Common Stock' },
    { symbol: 'TATASTEEL.NS', description: 'TATA STEEL LTD', type: 'Common Stock' },
    { symbol: 'JSWSTEEL.NS', description: 'JSW STEEL LTD', type: 'Common Stock' },
    { symbol: 'ADANIENT.NS', description: 'ADANI ENTERPRISES LTD', type: 'Common Stock' },
    { symbol: 'ADANIPORTS.NS', description: 'ADANI PORTS AND SEZ LTD', type: 'Common Stock' },
    { symbol: 'POLYCAB.NS', description: 'POLYCAB INDIA LTD', type: 'Common Stock' },
    { symbol: 'PNB.NS', description: 'PUNJAB NATIONAL BANK', type: 'Common Stock' },
    { symbol: 'TECHM.NS', description: 'TECH MAHINDRA LTD', type: 'Common Stock' },
    { symbol: 'DRREDDY.NS', description: 'DR REDDYS LABORATORIES LTD', type: 'Common Stock' },
    { symbol: 'CIPLA.NS', description: 'CIPLA LTD', type: 'Common Stock' },
    { symbol: 'COALINDIA.NS', description: 'COAL INDIA LTD', type: 'Common Stock' },
    { symbol: 'BPCL.NS', description: 'BHARAT PETROLEUM CORP LTD', type: 'Common Stock' },
    { symbol: 'IOC.NS', description: 'INDIAN OIL CORP LTD', type: 'Common Stock' },
    { symbol: 'HINDALCO.NS', description: 'HINDALCO INDUSTRIES LTD', type: 'Common Stock' },
    { symbol: 'GRASIM.NS', description: 'GRASIM INDUSTRIES LTD', type: 'Common Stock' },
];

// Base prices for mock data
const basePrices = {
    'RELIANCE.NS': 2950, 'TCS.NS': 4100, 'HDFCBANK.NS': 1600, 'ICICIBANK.NS': 1050,
    'INFY.NS': 1650, 'BHARTIARTL.NS': 1180, 'SBI.NS': 750, 'LICI.NS': 920,
    'HINDUNILVR.NS': 2500, 'ITC.NS': 450, 'KOTAKBANK.NS': 1780, 'LT.NS': 3400,
    'AXISBANK.NS': 1120, 'WIPRO.NS': 480, 'HCLTECH.NS': 1550, 'TATAMOTORS.NS': 780,
    'MARUTI.NS': 10500, 'SUNPHARMA.NS': 1650, 'TITAN.NS': 3200, 'BAJFINANCE.NS': 6800,
    'ASIANPAINT.NS': 2900, 'NESTLEIND.NS': 2450, 'ULTRACEMCO.NS': 9800,
    'POWERGRID.NS': 280, 'NTPC.NS': 320, 'ONGC.NS': 260, 'TATASTEEL.NS': 145,
    'JSWSTEEL.NS': 880, 'ADANIENT.NS': 2900, 'ADANIPORTS.NS': 1250,
    'POLYCAB.NS': 5600, 'PNB.NS': 105, 'TECHM.NS': 1350, 'DRREDDY.NS': 5800,
    'CIPLA.NS': 1480, 'COALINDIA.NS': 390, 'BPCL.NS': 580, 'IOC.NS': 160,
    'HINDALCO.NS': 580, 'GRASIM.NS': 2350
};

const getMockQuote = (symbol) => {
    const base = basePrices[symbol] || 1000;
    const change = (Math.random() * 40 - 20);
    const current = base + change;
    return {
        c: parseFloat(current.toFixed(2)),
        h: parseFloat((base + 30).toFixed(2)),
        l: parseFloat((base - 30).toFixed(2)),
        o: parseFloat((base - 5 + Math.random() * 10).toFixed(2)),
        pc: parseFloat(base.toFixed(2)),
        dp: parseFloat(((change / base) * 100).toFixed(2)),
        d: parseFloat(change.toFixed(2)),
        t: Date.now(),
        isMock: true
    };
};

// Search Stock
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        const query = q.toUpperCase();

        if (!API_KEY || API_KEY === 'your_finnhub_api_key_here') {
            const filtered = indianStocksMock.filter(s =>
                s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query)
            );
            // Enrich with mock prices for autocomplete
            const enriched = filtered.map(s => {
                const quote = getMockQuote(s.symbol);
                return { ...s, price: quote.c, change: quote.d, changePercent: quote.dp };
            });
            return res.json({ result: enriched });
        }

        try {
            const response = await axios.get(`${FINNHUB_BASE_URL}/search?q=${query}&token=${API_KEY}`);
            let results = response.data.result || [];

            const filteredResults = results.filter(s =>
                s.symbol.endsWith('.NS') || s.symbol.endsWith('.BO')
            );

            if (filteredResults.length === 0) {
                const matchingMocks = indianStocksMock.filter(s =>
                    s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query)
                ).map(s => {
                    const quote = getMockQuote(s.symbol);
                    return { ...s, price: quote.c, change: quote.d, changePercent: quote.dp };
                });
                return res.json({ result: matchingMocks });
            }

            res.json({ result: filteredResults });
        } catch (apiErr) {
            console.warn('Search API failed, falling back to mock:', apiErr.message);
            const matchingMocks = indianStocksMock.filter(s =>
                s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query)
            ).map(s => {
                const quote = getMockQuote(s.symbol);
                return { ...s, price: quote.c, change: quote.d, changePercent: quote.dp };
            });
            res.json({ result: matchingMocks });
        }
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get Quote
router.get('/quote/:symbol', auth, async (req, res) => {
    const { symbol } = req.params;
    try {
        if (!API_KEY || API_KEY === 'your_finnhub_api_key_here') {
            return res.json(getMockQuote(symbol));
        }

        try {
            const response = await axios.get(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
            if (response.data.c === 0) {
                console.warn(`Price unavailable for ${symbol} via API, using mock.`);
                return res.json(getMockQuote(symbol));
            }
            res.json(response.data);
        } catch (apiErr) {
            if (apiErr.response && (apiErr.response.status === 403 || apiErr.response.status === 429)) {
                console.warn(`API ${apiErr.response.status} error for ${symbol}, using mock.`);
                return res.json(getMockQuote(symbol));
            }
            throw apiErr;
        }
    } catch (err) {
        console.error('Quote error:', err.message);
        res.json(getMockQuote(symbol));
    }
});

module.exports = router;
