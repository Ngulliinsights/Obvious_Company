# Email Configuration Guide

## Overview
This guide will help you set up email functionality for The Obvious Company website, including contact forms and newsletter signups.

## Quick Setup Steps

### 1. Choose Your Email Provider

#### Gmail (Easiest for Development)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
3. **Copy the 16-character password** (spaces don't matter)

#### Professional Email Services (Recommended for Production)
- **SendGrid**: Free tier (100 emails/day)
- **Mailgun**: Free tier (5,000 emails/month)  
- **Amazon SES**: Pay-as-you-go pricing

### 2. Update Environment Variables

Edit `website/.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

**Important**: 
- Use your actual Gmail address for `SMTP_USER`
- Use the App Password (not your regular password) for `SMTP_PASS`
- Set `CONTACT_EMAIL` to where you want to receive contact form submissions

### 3. Test Your Configuration

Run the email test script:

```bash
cd website/server
node test-email.js
```

This will:
- ✅ Verify all environment variables are set
- 🔍 Test SMTP connection
- 📤 Send a test email to your contact address

### 4. Start the Server

```bash
cd website/server
npm run dev
```

## Email Features

### Contact Form (`/api/contact`)
- Sends notification to your contact email
- Sends auto-reply to the user
- Includes form validation and rate limiting

### Newsletter Signup (`/api/newsletter`)
- Sends welcome email to new subscribers
- Stores email for future campaigns
- Includes unsubscribe functionality

## Configuration Options

### Gmail Settings
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SendGrid Settings
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun Settings
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Custom Domain Email
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=contact@yourdomain.com
SMTP_PASS=your-email-password
```

## Troubleshooting

### Common Issues

#### "Authentication failed"
- ✅ Use App Password for Gmail (not regular password)
- ✅ Enable 2-Factor Authentication first
- ✅ Check for typos in credentials

#### "Connection timeout"
- ✅ Check SMTP_HOST and SMTP_PORT
- ✅ Try port 465 instead of 587
- ✅ Check firewall settings

#### "Invalid email address"
- ✅ Verify SMTP_USER is a valid email
- ✅ Check CONTACT_EMAIL format

### Testing Commands

```bash
# Test email configuration
node test-email.js

# Check server logs
npm run dev:verbose

# Test contact form endpoint
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` file to version control
- ✅ Use App Passwords instead of regular passwords
- ✅ Rotate credentials regularly

### Rate Limiting
- ✅ Contact forms: 50 submissions per 15 minutes
- ✅ Newsletter: 25 signups per 15 minutes
- ✅ API endpoints: 500 requests per 15 minutes

### Validation
- ✅ Email format validation
- ✅ Input sanitization
- ✅ Message length limits

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
WEBSITE_URL=https://yourdomain.com
SMTP_HOST=your-production-smtp-host
SMTP_USER=your-production-email
SMTP_PASS=your-production-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

### Recommended Production Setup
1. **Use professional email service** (SendGrid, Mailgun, SES)
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery** and bounce rates
4. **Set up email templates** for consistent branding

## Support

If you encounter issues:
1. Run `node test-email.js` to diagnose problems
2. Check server logs with `npm run dev:verbose`
3. Verify all environment variables are set correctly
4. Test with a simple email provider like Gmail first

## Email Templates

The system includes responsive HTML email templates for:
- 📧 Contact form notifications
- 🎉 Contact form auto-replies  
- 📬 Newsletter welcome emails
- 🔗 Lead magnet delivery emails

All templates are mobile-responsive and include The Obvious Company branding.