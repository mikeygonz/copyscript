const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('@danielxceron/youtube-transcript');
const { YoutubeTranscript: YoutubeTranscriptAlt } = require('youtube-transcript');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your production domain
// Allow server-to-server requests (no origin header) and browser requests from allowed origin
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server requests from Edge Functions)
    if (!origin) {
      return callback(null, true);
    }
    // Allow requests from the configured origin
    if (allowedOrigin === '*' || origin === allowedOrigin) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  credentials: false,
}));

app.use(express.json());

// Transcript endpoint using libraries (bypasses YouTube blocking by running from Fly.io)
app.post('/get-transcript', async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[Proxy] Fetching transcript via library for video:', videoId);

    let transcriptItems = null;
    let lastErrorMessage = null;

    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      console.log('[Proxy] Primary transcript library succeeded');
    } catch (primaryError) {
      lastErrorMessage = primaryError?.message || String(primaryError);
      console.log('[Proxy] Primary library failed:', lastErrorMessage);
      try {
        transcriptItems = await YoutubeTranscriptAlt.fetchTranscript(videoId);
        console.log('[Proxy] Alternative transcript library succeeded');
      } catch (altError) {
        lastErrorMessage = altError?.message || String(altError);
        console.log('[Proxy] Alternative library also failed:', lastErrorMessage);
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return res.status(404).json({
        error: 'No transcripts available for this video',
        details: lastErrorMessage,
      });
    }

    res.json({ transcript: transcriptItems });
  } catch (error) {
    console.error('[Proxy] Transcript library endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

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
        'Cookie': 'PREF=f1=50000000&hl=en&tz=UTC; CONSENT=YES+1',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20251118.01.00',
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

// Proxy endpoint for youtubei player API (fallback to fetch captions metadata)
app.post('/fetch-player', async (req, res) => {
  try {
    const { videoId, apiKey, clientName, clientVersion } = req.body;

    if (!videoId || !apiKey) {
      return res.status(400).json({ error: 'videoId and apiKey are required' });
    }

    const payload = {
      context: {
        client: {
          clientName: clientName || 'WEB',
          clientVersion: clientVersion || '2.20240222.09.00',
          hl: 'en',
          gl: 'US',
          utcOffsetMinutes: 0,
        },
      },
      videoId,
      racyCheckOk: true,
      contentCheckOk: true,
    };
    if (req.body.visitorData) {
      payload.context.client.visitorData = req.body.visitorData;
    }

    console.log('[Proxy] Fetching youtubei player API for video:', videoId);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Origin: 'https://www.youtube.com',
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    };

    if (req.body.visitorData) {
      headers['X-Goog-Visitor-Id'] = req.body.visitorData;
    }

    const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Proxy] youtubei player API returned status:', response.status, errorText);
      return res.status(response.status).json({
        error: `youtubei player API returned ${response.status}`,
        details: errorText,
      });
    }

    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error('[Proxy] youtubei player API error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Server running on port ${PORT}`);
  console.log(`[Proxy] Allowed origin: ${process.env.ALLOWED_ORIGIN || '*'}`);
});
