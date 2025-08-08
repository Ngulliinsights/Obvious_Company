# Railway Deployment Checklist

## Pre-Deployment

### 1. Code Preparation
- [ ] All code committed to Git repository
- [ ] Dependencies updated in package.json
- [ ] Build process tested locally
- [ ] Tests passing
- [ ] No sensitive data in code

### 2. Environment Setup
- [ ] Railway account created
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Gmail app password generated (for SMTP)
- [ ] Domain name ready (optional)

### 3. Configuration Files
- [ ] `railway.json` configured
- [ ] `Procfile` created
- [ ] Environment variables prepared
- [ ] Health check endpoint working

## Deployment Process

### 1. Initial Setup
```bash
# Login to Railway
railway login

# Initialize project (if not done)
railway init

# Link to existing project (if applicable)
railway link [project-id]
```

### 2. Set Environment Variables
```bash
# Required variables
railway variables set NODE_ENV=production
railway variables set WEBSITE_URL=https://your-app.railway.app
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password
railway variables set CONTACT_EMAIL=contact@theobviouscompany.com

# Security variables (generate secure values)
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set WEBHOOK_SECRET=$(openssl rand -base64 32)
```

### 3. Deploy
```bash
# Build and deploy
npm run build
railway up

# Or use deployment script
./deploy.sh
```

## Post-Deployment

### 1. Verification
- [ ] Application starts successfully
- [ ] Health check responds: `https://your-app.railway.app/api/health`
- [ ] Homepage loads correctly
- [ ] Contact form works
- [ ] Email sending functional
- [ ] All pages accessible

### 2. Testing
- [ ] Contact form submission
- [ ] Newsletter signup
- [ ] Assessment system (if applicable)
- [ ] Mobile responsiveness
- [ ] Performance check

### 3. Monitoring Setup
- [ ] Railway metrics enabled
- [ ] Error logging configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring (optional)

### 4. Domain Configuration (Optional)
- [ ] Custom domain added in Railway
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] WEBSITE_URL updated

## Production Optimization

### 1. Performance
- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] CDN setup (Railway provides this)
- [ ] Image optimization

### 2. Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation working

### 3. Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

## Troubleshooting

### Common Issues
1. **Build Failures**
   - Check build logs: `railway logs --deployment`
   - Verify package.json scripts
   - Ensure all dependencies listed

2. **Environment Variables**
   - List variables: `railway variables`
   - Check for typos in variable names
   - Verify sensitive values are set

3. **Health Check Failures**
   - Test locally: `npm start`
   - Check port binding: `process.env.PORT`
   - Verify endpoint responds

4. **Email Issues**
   - Test SMTP credentials
   - Check Gmail app password
   - Verify firewall settings

### Useful Commands
```bash
# View logs
railway logs

# Check status
railway status

# List deployments
railway deployments

# Open in browser
railway open

# View variables
railway variables

# Connect to shell
railway shell
```

## Rollback Plan

### If Deployment Fails
1. Check logs: `railway logs`
2. Identify issue from error messages
3. Fix locally and redeploy
4. Or rollback to previous deployment in Railway dashboard

### Emergency Rollback
1. Go to Railway dashboard
2. Select project
3. Go to Deployments tab
4. Click "Redeploy" on last working version

## Success Criteria

### Deployment Successful When:
- [ ] Application accessible via Railway URL
- [ ] Health check returns 200 status
- [ ] Contact form sends emails
- [ ] All static assets load
- [ ] No console errors
- [ ] Performance acceptable (< 3s load time)
- [ ] Mobile responsive
- [ ] SSL certificate active

### Performance Targets
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

## Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Check performance metrics monthly
- [ ] Update dependencies quarterly
- [ ] Review security settings quarterly
- [ ] Backup configuration annually

### Updates
- [ ] Test updates in staging first
- [ ] Deploy during low-traffic periods
- [ ] Monitor for 24h after deployment
- [ ] Have rollback plan ready