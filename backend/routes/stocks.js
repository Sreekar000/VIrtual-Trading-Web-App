const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

// yahoo-finance2 for reliable NSE/BSE price data
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';

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

// Base prices for mock data fallback
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

// Get live quote using yahoo-finance2 package
const getLiveQuote = async (symbol) => {
    if (!yahooFinance) return null;
    try {
        // Ensure symbol has .NS suffix for NSE
        const ySymbol = symbol.endsWith('.NS') || symbol.endsWith('.BO') ? symbol : `${symbol}.NS`;
        const quote = await yahooFinance.quote(ySymbol);
        if (!quote || !quote.regularMarketPrice) return null;

        return {
            c: quote.regularMarketPrice,
            h: quote.regularMarketDayHigh || quote.regularMarketPrice,
            l: quote.regularMarketDayLow || quote.regularMarketPrice,
            o: quote.regularMarketOpen || quote.regularMarketPrice,
            pc: quote.regularMarketPreviousClose || quote.regularMarketPrice,
            d: quote.regularMarketChange || 0,
            dp: quote.regularMarketChangePercent || 0,
            t: Date.now(),
            isMock: false
        };
    } catch (err) {
        console.warn(`yahoo-finance2 error for ${symbol}:`, err.message);
        return null;
    }
};

// Search Stock — uses Twelve Data search if key available, else mock list
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        const query = q.toUpperCase();

        // Try Twelve Data search first (works on free plan for Indian stocks)
        if (TWELVE_DATA_API_KEY) {
            try {
                const response = await axios.get(`https://api.twelvedata.com/symbol_search?symbol=${query}&apikey=${TWELVE_DATA_API_KEY}`);
                if (response.data.status === 'ok' && response.data.data) {
                    const results = response.data.data
                        .filter(s => s.exchange === 'NSE' || s.exchange === 'BSE')
                        .slice(0, 15)
                        .map(s => ({
                            symbol: `${s.symbol}.NS`,
                            description: s.instrument_name || s.symbol,
                            type: s.instrument_type || 'Common Stock',
                            exchange: s.exchange
                        }));

                    if (results.length > 0) {
                        // Enrich with live prices for top results
                        const enriched = await Promise.all(results.slice(0, 5).map(async (s) => {
                            const quote = await getLiveQuote(s.symbol);
                            if (quote) {
                                return { ...s, price: quote.c, change: quote.d, changePercent: quote.dp };
                            }
                            const mockQ = getMockQuote(s.symbol);
                            return { ...s, price: mockQ.c, change: mockQ.d, changePercent: mockQ.dp };
                        }));
                        // Add remaining without price enrichment
                        const rest = results.slice(5).map(s => {
                            const mockQ = getMockQuote(s.symbol);
                            return { ...s, price: mockQ.c, change: mockQ.d, changePercent: mockQ.dp };
                        });
                        return res.json({ result: [...enriched, ...rest] });
                    }
                }
            } catch (searchErr) {
                console.warn('Twelve Data search failed:', searchErr.message);
            }
        }

        // Fallback: filter mock list
        const filtered = indianStocksMock.filter(s =>
            s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query)
        );
        const enriched = await Promise.all(filtered.map(async (s) => {
            const quote = await getLiveQuote(s.symbol);
            if (quote) {
                return { ...s, price: quote.c, change: quote.d, changePercent: quote.dp };
            }
            const mockQ = getMockQuote(s.symbol);
            return { ...s, price: mockQ.c, change: mockQ.d, changePercent: mockQ.dp };
        }));
        return res.json({ result: enriched });
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get Quote — yahoo-finance2 with mock fallback
router.get('/quote/:symbol', auth, async (req, res) => {
    const { symbol } = req.params;
    try {
        const liveQuote = await getLiveQuote(symbol);
        if (liveQuote) {
            console.log(`Live quote for ${symbol}: ₹${liveQuote.c} (${liveQuote.dp > 0 ? '+' : ''}${liveQuote.dp.toFixed(2)}%)`);
            return res.json(liveQuote);
        }
        console.warn(`Live quote unavailable for ${symbol}, using mock.`);
        res.json(getMockQuote(symbol));
    } catch (err) {
        console.error('Quote error:', err.message);
        res.json(getMockQuote(symbol));
    }
});

// Get Batch Quotes — Fetch multiple symbols at once
router.post('/quotes', auth, async (req, res) => {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ message: 'Symbols array required' });
    }

    try {
        const quotes = await Promise.all(symbols.map(async (symbol) => {
            const live = await getLiveQuote(symbol);
            if (live) return { symbol, ...live };
            return { symbol, ...getMockQuote(symbol) };
        }));

        const response = {};
        quotes.forEach(q => {
            const { symbol, ...data } = q;
            response[symbol] = data;
        });

        res.json(response);
    } catch (err) {
        console.error('Batch quote error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
