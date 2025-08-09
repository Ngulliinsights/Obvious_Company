# GitHub Deployment Guide

Since Railway CLI uploads are timing out, let's use GitHub integration which is
more reliable.

## 🚀 Quick GitHub Deployment

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `obvious-company-website`
3. Description: `The Obvious Company - Strategic Intelligence Amplification`
4. Make it Public or Private (your choice)
5. **Don't** initialize with README, .gitignore, or license (we have files
   already)
6. Click "Create repository"

### Step 2: Push Code to GitHub

```bash
# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/obvious-company-website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Connect Railway to GitHub

1. Go to Railway Dashboard:
   https://railway.app/project/c9f320a3-c19d-4e4d-830b-3ffbc11a64dd
2. Click on "Obvious_Company" service
3. Click "Settings" → "Source"
4. Click "Connect Repo"
5. Select your GitHub repository
6. Railway will automatically deploy!

## 🔧 Alternative: Manual Upload

If you prefer not to use GitHub:

1. Go to Railway Dashboard
2. Click "Obvious_Company" service
3. Look for "Deploy" or "Upload" option
4. Upload the `railway-deploy` folder (contains optimized files)

## ✅ After Deployment

Add these environment variables in Railway dashboard:

```
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
WEBSITE_URL=https://your-app.railway.app
```

## 🌐 Your Website Will Be Live At:

`https://obviouscompany-production.up.railway.app`

The GitHub approach is much more reliable than CLI uploads!
