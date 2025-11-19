const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your production domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy endpoint for YouTube video pages
app.post('/fetch-youtube', async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[Proxy] Fetching video:', videoId);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      }
    });

    if (!response.ok) {
      console.log('[Proxy] YouTube returned status:', response.status);
      return res.status(response.status).json({
        error: `YouTube returned ${response.status}`
      });
    }

    const html = await response.text();
    console.log('[Proxy] Successfully fetched video page, length:', html.length);

    // Return the HTML to your Edge Function
    res.json({
      html,
      videoId,
      length: html.length
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Proxy endpoint for transcript XML
app.post('/fetch-transcript', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    console.log('[Proxy] Fetching transcript URL:', url.substring(0, 100));

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/xml,application/xml',
      }
    });

    if (!response.ok) {
      console.log('[Proxy] Transcript fetch failed with status:', response.status);
      return res.status(response.status).json({
        error: `Transcript fetch returned ${response.status}`
      });
    }

    const xmlText = await response.text();
    console.log('[Proxy] Successfully fetched transcript, length:', xmlText.length);

    res.json({
      xml: xmlText,
      length: xmlText.length
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Server running on port ${PORT}`);
  console.log(`[Proxy] Allowed origin: ${process.env.ALLOWED_ORIGIN || '*'}`);
});
