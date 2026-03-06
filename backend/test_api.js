const axios = require('axios');

async function testBackend() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully');

        const symbols = ['RELIANCE.NS', 'TCS.NS'];
        for (let i = 0; i < 3; i++) {
            const res = await axios.post('http://localhost:5000/api/stocks/quotes',
                { symbols },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`\nPoll ${i + 1}:`);
            symbols.forEach(sym => {
                const quote = res.data[sym];
                console.log(`  ${sym}: c=${quote?.c}, isMock=${quote?.isMock}`);
            });
            if (i < 2) await new Promise(r => setTimeout(r, 2000));
        }
    } catch (err) {
        console.error('Test error:', err.response?.data || err.message);
    }
}

testBackend();
