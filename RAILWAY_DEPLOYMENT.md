# Railway Deployment Guide

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment Steps

### 1. Prerequisites
- Railway account (https://railway.app)
- GitHub repository with your code
- Environment variables ready

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Environment Variables

Set these in Railway dashboard or via CLI:

#### Required Variables
```bash
# Server
NODE_ENV=production
PORT=3000
WEBSITE_URL=https://your-app.railway.app

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

#### Optional Variables
```bash
# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
WEBHOOK_SECRET=your-webhook-secret-key

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Integrations
CALENDLY_WEBHOOK_URL=https://calendly.com/webhooks/your-webhook-url
```

### 4. Set Environment Variables via CLI

```bash
# Set required variables
railway variables set NODE_ENV=production
railway variables set WEBSITE_URL=https://your-app.railway.app
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password
railway variables set CONTACT_EMAIL=contact@theobviouscompany.com
```

### 5. Custom Domain (Optional)

1. Go to Railway dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Update DNS records as instructed
6. Update WEBSITE_URL environment variable

### 6. Health Check

Railway will automatically check `/api/health` endpoint for health status.

### 7. Logs and Monitoring

```bash
# View logs
railway logs

# View service status
railway status
```

## Deployment Features

### Automatic Features
- ✅ Health checks on `/api/health`
- ✅ Automatic restarts on failure
- ✅ HTTPS/SSL certificates
- ✅ CDN for static assets
- ✅ Environment variable management
- ✅ Git-based deployments

### Performance Optimizations
- ✅ Gzip compression
- ✅ Static file caching
- ✅ Rate limiting
- ✅ Security headers
- ✅ Optimized build process

### Security Features
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Rate limiting
- ✅ Environment-based security

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs
   railway logs --deployment
   
   # Ensure all dependencies are in package.json
   npm install --save missing-package
   ```

2. **Environment Variables Not Set**
   ```bash
   # List current variables
   railway variables
   
   # Set missing variables
   railway variables set VARIABLE_NAME=value
   ```

3. **Health Check Fails**
   - Ensure server starts on correct PORT
   - Check `/api/health` endpoint responds
   - Verify no blocking operations in startup

4. **Email Not Working**
   - Verify SMTP credentials
   - Check Gmail app passwords (not regular password)
   - Ensure SMTP_HOST and SMTP_PORT are correct

### Performance Monitoring

```bash
# Monitor resource usage
railway metrics

# Check deployment status
railway status

# View recent deployments
railway deployments
```

## Production Checklist

- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Email credentials tested
- [ ] Health check endpoint working
- [ ] SSL certificate active
- [ ] Analytics configured (optional)
- [ ] Contact forms tested
- [ ] Performance monitoring enabled

## Support

For Railway-specific issues:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

For application issues:
- Check server logs: `railway logs`
- Review health endpoint: `/api/health`
- Test email functionality: `/api/test-email`