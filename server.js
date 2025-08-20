const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  const { shop, accessToken, query, variables } = req.body;

  if (!shop || !accessToken || !query) {
    return res.status(400).json({ error: 'Missing required parameters: shop, accessToken, and query.' });
  }

  const shopifyUrl = `https://${shop}/admin/api/2023-01/graphql.json`;

  try {
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'An error occurred while proxying the request.' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
