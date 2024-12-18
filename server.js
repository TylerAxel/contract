const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const UPS_CLIENT_ID = 'gIwq9XE7Xvl2AGkW20F61eMuo9OO40rAGWwUIkthEbiEDyUI';
const UPS_CLIENT_SECRET = '3TLuzNtYr46DEqSMCzVNcxPAGtlXq8oGaVhnFxQd5F6ANZbkEM080hoQbDYE3d0B';
const UPS_BASE_URL = 'https://onlinetools.ups.com';

// Token endpoint
app.post('/api/ups/token', async (req, res) => {
    try {
        const credentials = Buffer.from(`${UPS_CLIENT_ID}:${UPS_CLIENT_SECRET}`).toString('base64');
        const response = await fetch(`${UPS_BASE_URL}/security/v1/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Token Error:', error);
        res.status(500).json({ error: 'Failed to get token' });
    }
});

// Transit time endpoint
app.post('/api/ups/transit-time', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await fetch(`${UPS_BASE_URL}/api/shipments/v1/transittimes`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'transId': req.headers.transid,
                'transactionSrc': 'testing'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Transit Time Error:', error);
        res.status(500).json({ error: 'Failed to get transit time' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});