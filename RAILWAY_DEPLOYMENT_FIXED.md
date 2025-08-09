# 🚂 Railway Deployment - FIXED VERSION

## 🚨 CRITICAL: Use This Process

The previous deployment configurations had conflicts. This is the corrected
process.

## ✅ CORRECTED DEPLOYMENT STEPS

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 2. Initialize Project

```bash
# In your project root
railway init
# Select "Empty Project" and give it a name
```

### 3. Set Environment Variables (CRITICAL)

```bash
# Required for email functionality
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-gmail-app-password

# Security variables (generate secure random strings)
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set WEBHOOK_SECRET=$(openssl rand -base64 32)

# Basic configuration
railway variables set NODE_ENV=production
railway variables set CONTACT_EMAIL=contact@theobviouscompany.com
```

### 4. Deploy

```bash
railway up
```

## 🔧 WHAT WAS FIXED

### **Problem 1: Conflicting Build Commands**

- **Before**: Multiple package.json files with different start commands
- **After**: Single clear build and start process

### **Problem 2: Workspace Issues**

- **Before**: Railway couldn't handle npm workspaces properly
- **After**: Removed workspace configuration, direct path references

### **Problem 3: Missing Dependencies**

- **Before**: Dependencies installed in wrong locations
- **After**: Explicit dependency installation in correct directory

### **Problem 4: Build Process**

- **Before**: Complex build chain with verification
- **After**: Simple CSS build + server start

## 📋 DEPLOYMENT VERIFICATION

After deployment, verify these endpoints:

1. **Health Check**: `https://your-app.railway.app/api/health`
2. **Homepage**: `https://your-app.railway.app/`
3. **Contact Form**: Test form submission
4. **Assessment**: `https://your-app.railway.app/assessment/`

## 🚨 COMMON DEPLOYMENT FAILURES

### **Build Fails with "Module not found"**

**Cause**: Dependencies not installed in server directory **Fix**: Railway.json
now explicitly installs in correct location

### **Server Starts but 500 Errors**

**Cause**: Missing environment variables **Fix**: Set SMTP_USER and SMTP_PASS in
Railway dashboard

### **Health Check Fails**

**Cause**: Server not binding to correct port **Fix**: Railway automatically
sets PORT variable

### **Email Features Don't Work**

**Cause**: Gmail credentials not set or incorrect **Fix**: Use Gmail App
Password, not regular password

## 🎯 SUCCESS INDICATORS

When deployment works correctly:

- ✅ Build completes without errors
- ✅ Health check returns 200 status
- ✅ Homepage loads with all assets
- ✅ Contact form can send emails
- ✅ No console errors in browser
- ✅ Assessment system works (if enabled)

## 🔄 ROLLBACK PLAN

If deployment fails:

1. Check Railway logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Test locally first: `npm run dev`
4. Use Railway dashboard to redeploy previous version

## 📞 SUPPORT

If you still have issues:

1. Check Railway logs for specific error messages
2. Verify all environment variables are set
3. Test the exact same configuration locally
4. Contact Railway support with specific error logs

---

**Key Change**: This deployment process eliminates the workspace configuration
and conflicting start commands that were causing failures.
