# The Obvious Company Website

Strategic Intelligence Amplification website with hybrid static/dynamic architecture.

## 🚀 Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm run setup

# Start development server
npm run dev

# Test email configuration
npm run test:email
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
├── website/                 # Static website files
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   ├── images/             # Static images
│   ├── server/             # Node.js backend
│   └── *.html              # HTML pages
├── tests/                  # Test files
├── .vscode/                # VS Code configuration
└── config files            # Linting, formatting, etc.
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with watch
npm run dev:verbose      # Start with detailed logging

# Building
npm run build           # Build for production
npm run build:css       # Build CSS only

# Testing
npm test               # Run all tests
npm run test:email     # Test email configuration
npm run test:e2e       # Run E2E tests

# Code Quality
npm run lint           # Lint all files
npm run format         # Format all files
npm run validate       # Lint + test

# Deployment
./deploy.sh            # Deploy to Railway
npm run deploy:production  # Production deployment
```

## 🚂 Railway Deployment

### One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Manual Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway init
railway up
```

### Environment Variables
Set these in Railway dashboard:
- `SMTP_USER` - Gmail email address
- `SMTP_PASS` - Gmail app password
- `CONTACT_EMAIL` - Contact form recipient
- `WEBSITE_URL` - Your Railway app URL

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for complete guide.

### Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `website/`
3. **Test Changes**: Visit `http://localhost:3000`
4. **Run Tests**: `npm test`
5. **Commit**: Git hooks will run linting automatically

## 📧 Email Configuration

1. **Set up Gmail App Password**:
   - Enable 2FA on Gmail
   - Generate App Password
   - Update `.env` file

2. **Test Configuration**:
   ```bash
   npm run test:email
   ```

3. **See**: `EMAIL_SETUP.md` for detailed instructions

## 🧪 Testing

### Unit Tests (Jest)
```bash
npm run test:frontend    # Frontend JavaScript tests
npm run test:server      # Backend Node.js tests
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Full browser testing
```

### Manual Testing
- Contact form: `http://localhost:3000/contact.html`
- Newsletter: `http://localhost:3000/#newsletter`
- Assessment: `http://localhost:3000/assessment/`

## 🎨 Code Quality

### Automatic Formatting
- **Prettier**: Code formatting
- **ESLint**: JavaScript linting
- **Stylelint**: CSS linting
- **HTMLHint**: HTML validation

### Git Hooks
- **Pre-commit**: Runs linting and formatting
- **Commit-msg**: Validates commit message format

### VS Code Integration
- Install recommended extensions
- Automatic formatting on save
- Integrated linting

## 🏗️ Architecture

### Hybrid Approach
- **Static Files**: HTML, CSS, JS served directly
- **Dynamic API**: Node.js backend for forms, email
- **Progressive Enhancement**: Works without JavaScript

### Key Features
- 📱 Responsive design
- ⚡ Performance optimized
- 🔒 Security headers
- 📧 Email integration
- 📊 Analytics ready
- ♿ Accessibility compliant

## 🚀 Deployment

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:production
```

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3000
NODE_ENV=development
WEBSITE_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=contact@theobviouscompany.com
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features

## 📚 Documentation

- `EMAIL_SETUP.md` - Email configuration guide
- `IMAGE_INTEGRATION.md` - Image usage documentation
- `website/server/README.md` - Backend documentation

## 🆘 Troubleshooting

### Common Issues

**Email not working?**
```bash
npm run test:email
```

**Linting errors?**
```bash
npm run lint
npm run format
```

**Server won't start?**
```bash
npm run health
```

**Tests failing?**
```bash
npm run test:verbose
```

## 📞 Support

- Check existing issues
- Run diagnostic commands
- Review documentation
- Create detailed bug reports

## 📄 License

Private - The Obvious Company
