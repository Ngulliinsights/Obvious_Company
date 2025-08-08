# Technology Stack & Build System

## Core Technologies

### Website Stack
- **Backend**: Node.js 18+ with Express.js server
- **Frontend**: Static HTML/CSS/JavaScript (no framework)
- **Email**: Nodemailer with SMTP integration
- **Security**: Helmet.js, CORS, express-rate-limit, express-validator
- **Performance**: Compression, service workers, caching

### Dependencies
```json
{
  "express": "^4.18.2",
  "helmet": "^7.1.0", 
  "compression": "^1.7.4",
  "cors": "^2.8.5",
  "nodemailer": "^6.9.7",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "dotenv": "^16.3.1"
}
```

## Build System & Commands

### Development Setup
```bash
# Install server dependencies
cd website/server
npm install

# Copy environment template
cp ../.env.example ../.env
# Edit .env with SMTP credentials

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build and start production
npm start

# Or use deployment script
./deploy.sh
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development with nodemon
- `npm run build` - Build CSS assets
- `npm run build:css` - Process CSS with PostCSS

## Environment Configuration

### Required Environment Variables
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

## Architecture Patterns

### Static-First Approach
- HTML files serve as primary content delivery
- JavaScript enhances functionality progressively
- CSS uses custom properties for theming
- Service worker provides offline capabilities

### API Endpoints
- `POST /api/contact` - Contact form submission
- `POST /api/newsletter` - Newsletter signup
- `GET /api/health` - Health check

### Performance Features
- Gzip compression for all assets
- Browser caching with proper headers
- Service worker for offline support and caching
- Lazy loading for images and content
- Responsive images and optimization

### Security Implementation
- Helmet.js for security headers
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for cross-origin requests