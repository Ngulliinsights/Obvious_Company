const config = {
  production: {
    apiBaseUrl: '/api',
    assetsUrl: '/assets',
    websiteUrl: process.env.WEBSITE_URL || 'https://ngulliinsights.github.io/Obvious_Company',
    isStatic: true, // For GitHub Pages
    features: {
      contactForm: false, // Disable server-dependent features
      newsletter: false,
      assessment: true,
      analytics: true,
    },
  },
  development: {
    apiBaseUrl: 'http://localhost:3000/api',
    assetsUrl: '/assets',
    websiteUrl: 'http://localhost:3000',
    isStatic: false,
    features: {
      contactForm: true,
      newsletter: true,
      assessment: true,
      analytics: true,
    },
  },
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
