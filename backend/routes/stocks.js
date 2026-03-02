const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

// Mock data generator for fallback
const getMockQuote = (symbol) => {
    const basePrices = {
        'RELIANCE.NS': 2950,
        'TCS.NS': 4100,
        'HDFCBANK.NS': 1600,
        'INFY.NS': 1650,
        'SBI.NS': 750
    };
    const base = basePrices[symbol] || 1000;
    return {
        c: base + (Math.random() * 20 - 10),
        h: base + 30,
        l: base - 30,
        o: base - 5,
        pc: base,
        t: Date.now(),
        isMock: true
    };
};

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
    { symbol: 'ITC.NS', description: 'ITC LTD', type: 'Common Stock' }
];

// Search Stock
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        const query = q.toUpperCase();

        if (!API_KEY || API_KEY === 'your_finnhub_api_key_here') {
            return res.json({
                result: indianStocksMock.filter(s => s.symbol.includes(query) || s.description.includes(query))
            });
        }

        try {
            const response = await axios.get(`${FINNHUB_BASE_URL}/search?q=${query}&token=${API_KEY}`);
            let results = response.data.result || [];

            // Filter for Indian stocks
            const filteredResults = results.filter(s =>
                s.symbol.endsWith('.NS') || s.symbol.endsWith('.BO')
            );

            // If no results from API, add our mock ones if they match
            if (filteredResults.length === 0) {
                const matchingMocks = indianStocksMock.filter(s => s.symbol.includes(query) || s.description.includes(query));
                return res.json({ result: matchingMocks });
            }

            res.json({ result: filteredResults });
        } catch (apiErr) {
            console.warn('Search API failed, falling back to mock:', apiErr.message);
            const matchingMocks = indianStocksMock.filter(s => s.symbol.includes(query) || s.description.includes(query));
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
                // Finnhub often returns 0 for non-US stocks in free tier
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
        // Final fallback
        res.json(getMockQuote(symbol));
    }
});

module.exports = router;
