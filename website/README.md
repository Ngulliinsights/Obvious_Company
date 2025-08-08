# The Obvious Company - Marketing Website

A fast, modern marketing website for The Obvious Company's Strategic Intelligence Amplification services.

## Features

- **Lightning Fast**: Optimized for speed with compression, caching, and service workers
- **Fully Responsive**: Mobile-first design that works on all devices
- **SEO Optimized**: Proper meta tags, structured data, and semantic HTML
- **Contact Forms**: Integrated email handling with validation and auto-replies
- **Security**: Helmet.js security headers and rate limiting
- **Performance**: Service worker caching and optimized assets

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   cd website/server
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your email credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Visit**: http://localhost:3000

### Production Deployment

1. **Build for production**:
   ```bash
   npm start
   ```

2. **Deploy to your hosting provider** (Vercel, Netlify, DigitalOcean, etc.)

## Environment Variables

Create a `.env` file with:

```env
# Server
PORT=3000
NODE_ENV=production
WEBSITE_URL=https://yourdomain.com

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

## Email Setup

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

### Other Providers
Update `SMTP_HOST` and `SMTP_PORT` for your email provider.

## File Structure

```
website/
├── index.html              # Homepage
├── about.html              # About page
├── services.html           # Services page
├── contact.html            # Contact page
├── 404.html               # 404 error page
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   └── main.js           # Main JavaScript
├── server/
│   ├── server.js         # Express server
│   └── package.json      # Server dependencies
├── sw.js                 # Service worker
└── .env.example          # Environment template
```

## Performance Features

- **Compression**: Gzip compression for all assets
- **Caching**: Browser caching with proper headers
- **Service Worker**: Offline support and asset caching
- **Minification**: CSS and JS optimization
- **Image Optimization**: Responsive images and lazy loading

## Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Form data sanitization
- **CORS**: Cross-origin request handling

## API Endpoints

- `POST /api/contact` - Contact form submission
- `POST /api/newsletter` - Newsletter signup
- `GET /api/health` - Health check

## Customization

### Colors
Update CSS variables in `css/styles.css`:
```css
:root {
    --clarity-blue: #2E5BBA;
    --insight-green: #00A676;
    --energy-amber: #F7931E;
    /* ... */
}
```

### Content
- Edit HTML files directly
- Update contact information in footer
- Modify service offerings in `services.html`

### Branding
- Replace logo dots with your logo
- Update favicon in HTML head
- Modify social media links

## Deployment Options

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

### Netlify
1. Connect repository
2. Build command: `cd server && npm install`
3. Publish directory: `./`

### Traditional Hosting
1. Upload files to web server
2. Install Node.js on server
3. Run `npm start` with process manager (PM2)

## Support

For technical support or customization requests, contact The Obvious Company development team.

## License

© 2025 The Obvious Company. All rights reserved.