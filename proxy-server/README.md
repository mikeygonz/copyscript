# YouTube Transcript Proxy Server

A simple Node.js proxy server to fetch YouTube video pages and transcripts, bypassing serverless IP blocking.

## Why This Is Needed

YouTube blocks requests from serverless providers like Vercel, returning stripped-down responses without caption data. This proxy runs on a VPS with a clean IP that YouTube doesn't block.

## Quick Start

### 1. Deploy to a VPS

**Option A: Digital Ocean ($5/month)**
```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create app directory
mkdir -p /opt/youtube-proxy
cd /opt/youtube-proxy

# Copy files (or git clone your repo)
# Upload index.js and package.json

# Install dependencies
npm install

# Set allowed origin (your production domain)
export ALLOWED_ORIGIN=https://www.copyscript.app

# Start the server
npm start
```

**Option B: Use PM2 for Production**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
ALLOWED_ORIGIN=https://www.copyscript.app pm2 start index.js --name youtube-proxy

# Save PM2 config and setup auto-restart
pm2 save
pm2 startup
```

### 2. Set Up Firewall

```bash
# Allow port 3001 (or your chosen port)
ufw allow 3001/tcp
ufw enable
```

### 3. (Optional) Use Nginx as Reverse Proxy

```bash
# Install Nginx
apt-get install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/youtube-proxy << 'EOF'
server {
    listen 80;
    server_name your-proxy-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/youtube-proxy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Install Let's Encrypt for HTTPS (optional but recommended)
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-proxy-domain.com
```

### 4. Update Your Vercel App

In your Edge Function, change the fetch URLs to use your proxy:

```javascript
// Instead of:
const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`)

// Use:
const response = await fetch('https://your-proxy-domain.com/fetch-youtube', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ videoId })
})
const data = await response.json()
const html = data.html
```

## Environment Variables

- `PORT` - Port to run on (default: 3001)
- `ALLOWED_ORIGIN` - CORS allowed origin (default: * - allows all)

## API Endpoints

### POST /fetch-youtube
Fetches a YouTube video page HTML.

**Request:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "html": "<html>...</html>",
  "videoId": "dQw4w9WgXcQ",
  "length": 1234567
}
```

### POST /fetch-transcript
Fetches transcript XML from a YouTube transcript URL.

**Request:**
```json
{
  "url": "https://www.youtube.com/api/timedtext?v=..."
}
```

**Response:**
```json
{
  "xml": "<?xml version=...",
  "length": 12345
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

## Cost

- **VPS**: ~$5/month (Digital Ocean, Vultr, Hetzner)
- **Bandwidth**: Negligible for most use cases
- **Total**: ~$5/month

## Security Notes

1. Set `ALLOWED_ORIGIN` to your production domain only
2. Use HTTPS with Nginx + Let's Encrypt
3. Consider adding rate limiting if needed
4. Monitor logs for abuse

## Alternatives if you don't want to manage a VPS

1. **Railway.app** - Deploy with one click, ~$5/month
2. **Fly.io** - Free tier available, auto-scaling
3. **Render.com** - Free tier for low traffic

All of these should work since they have different IP ranges than Vercel.
