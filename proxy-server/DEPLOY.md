# Quick Deploy Guide

## Easiest Options (No server management needed)

### Option 1: Railway.app (Recommended - Click to deploy)

1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect the `proxy-server` directory
6. Add environment variable: `ALLOWED_ORIGIN=https://www.copyscript.app`
7. Railway gives you a URL like `https://your-app.railway.app`

**Cost**: ~$5/month after free trial

### Option 2: Render.com (Also very easy)

1. Go to [Render.com](https://render.com/)
2. Sign up and click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `proxy-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `ALLOWED_ORIGIN=https://www.copyscript.app`
5. Deploy!

**Cost**: Free tier available, or $7/month for always-on

### Option 3: Fly.io (Most generous free tier)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to proxy-server directory
cd proxy-server

# Login to Fly.io
fly auth login

# Launch app (will ask questions - accept defaults)
fly launch --name youtube-transcript-proxy

# Set environment variable
fly secrets set ALLOWED_ORIGIN=https://www.copyscript.app

# Deploy
fly deploy
```

**Cost**: Free tier includes 3 shared VMs

---

## Manual VPS Deploy (If you prefer)

### Digital Ocean / Vultr / Hetzner ($5/month)

```bash
# 1. SSH into your VPS
ssh root@your-vps-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# 3. Clone your repo (or upload files)
git clone https://github.com/yourusername/your-repo.git
cd your-repo/proxy-server

# 4. Install dependencies
npm install

# 5. Install PM2 for process management
npm install -g pm2

# 6. Start the proxy
ALLOWED_ORIGIN=https://www.copyscript.app PORT=3001 pm2 start index.js --name youtube-proxy

# 7. Save PM2 config and enable auto-start
pm2 save
pm2 startup

# 8. Allow port in firewall
ufw allow 3001/tcp
ufw enable
```

### Optional: Add Nginx for HTTPS

```bash
# Install Nginx and Certbot
apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/youtube-proxy << 'EOF'
server {
    listen 80;
    server_name proxy.yourdomain.com;

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

# Enable site
ln -s /etc/nginx/sites-available/youtube-proxy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate (free)
certbot --nginx -d proxy.yourdomain.com
```

---

## After Deployment

### 1. Test your proxy

```bash
curl -X POST https://your-proxy-url.com/health
# Should return: {"status":"ok","timestamp":"..."}

curl -X POST https://your-proxy-url.com/fetch-youtube \
  -H "Content-Type: application/json" \
  -d '{"videoId":"dQw4w9WgXcQ"}'
# Should return HTML with length > 1000000
```

### 2. Add to Vercel

Go to your Vercel project settings:

1. Settings → Environment Variables
2. Add: `YOUTUBE_PROXY_URL` = `https://your-proxy-url.com`
3. Redeploy your app

### 3. Test in production

Try fetching a transcript - logs should show:
```
[Edge] Using proxy server: https://your-proxy-url.com
[Edge] Successfully fetched via proxy, length: 1234567
[Edge] Found 2 caption tracks
[Edge] Success! Returning 123 transcript items
```

---

## Troubleshooting

**Proxy returns 500 error**
- Check proxy logs: `pm2 logs youtube-proxy` (if using PM2)
- Ensure Node.js version is 18+: `node --version`

**CORS errors**
- Make sure `ALLOWED_ORIGIN` matches your production domain exactly
- Include https:// in the URL

**Timeout errors**
- Increase timeout in Edge Function (already set to 15s)
- Check proxy server has good internet connection

**Still getting YouTube blocking**
- Your VPS IP might be flagged - try a different provider
- Railway/Fly.io regularly rotate IPs so this is less likely

---

## Cost Comparison

| Service | Free Tier | Paid | Notes |
|---------|-----------|------|-------|
| **Fly.io** | 3 VMs free | $0 | Best free option |
| **Render** | 750 hrs/mo | $7/mo | Sleeps after inactivity (free tier) |
| **Railway** | $5 credit | $5/mo | Reliable, good DX |
| **Digital Ocean** | None | $5/mo | Full VPS control |

**Recommendation**: Start with Fly.io (free), upgrade to Railway if you need 24/7 reliability.
