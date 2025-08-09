# Deployment Options for The Obvious Company Website

## 🚀 Platform Options

### 1. Vercel (Recommended for Node.js + Static)

**Best for**: Full-stack applications with API routes

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add CONTACT_EMAIL
```

**Features**:

- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ GitHub integration
- ✅ Custom domains

### 2. Netlify (Great for Static + Functions)

**Best for**: Static sites with serverless functions

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

**Features**:

- ✅ Static site hosting
- ✅ Serverless functions
- ✅ Form handling
- ✅ GitHub integration
- ✅ Custom domains

### 3. Heroku (Traditional PaaS)

**Best for**: Traditional server deployment

```bash
# Install Heroku CLI
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
heroku create obvious-company
git push heroku main

# Set environment variables
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
```

### 4. DigitalOcean App Platform

**Best for**: Managed container deployment

- Connect GitHub repository
- Auto-detects Node.js
- Set environment variables in dashboard
- Automatic scaling

### 5. Docker Deployment (Any VPS)

**Best for**: Self-hosted on VPS/dedicated servers

```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t obvious-company .
docker run -p 3000:3000 --env-file website/.env obvious-company
```

## 🔧 Environment Variables Required

For all platforms, set these environment variables:

```
NODE_ENV=production
PORT=3000
WEBSITE_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

## 📋 Pre-Deployment Checklist

- ✅ Environment variables configured
- ✅ Gmail app password generated
- ✅ Domain name ready (optional)
- ✅ SSL certificate (automatic on most platforms)
- ✅ Build process tested locally

## 🎯 Recommended Deployment Flow

### Option 1: Vercel (Easiest)

1. Push code to GitHub
2. Connect Vercel to GitHub
3. Set environment variables
4. Deploy automatically

### Option 2: Netlify

1. Push code to GitHub
2. Connect Netlify to GitHub
3. Configure build settings
4. Set environment variables
5. Deploy

### Option 3: Docker (Most Control)

1. Set up VPS (DigitalOcean, Linode, AWS EC2)
2. Install Docker
3. Clone repository
4. Configure environment
5. Run docker-compose

## 🌐 Expected URLs

- **Vercel**: `https://obvious-company.vercel.app`
- **Netlify**: `https://obvious-company.netlify.app`
- **Heroku**: `https://obvious-company.herokuapp.com`
- **Custom Domain**: `https://theobviouscompany.com`

## 🔍 Health Check

All platforms can monitor: `/api/health`

## 📊 Performance Features

- ✅ Gzip compression
- ✅ Static file caching
- ✅ CDN integration
- ✅ Security headers
- ✅ Rate limiting
- ✅ Health monitoring

Choose the platform that best fits your needs and technical comfort level!
