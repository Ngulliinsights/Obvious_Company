module.exports = {
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  plugins: [
    'html'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // Error Prevention
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code Quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Style (handled by Prettier, but some logical rules)
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  },
  overrides: [
    {
      // Server-side Node.js files
      files: ['website/server/**/*.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off' // Allow console in server code
      }
    },
    {
      // Client-side browser files
      files: ['website/js/**/*.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        // Define global variables available in browser
        'websiteController': 'readonly',
        'showNotification': 'readonly'
      }
    },
    {
      // HTML files with embedded JavaScript
      files: ['website/**/*.html'],
      processor: 'html/html',
      rules: {
        'no-undef': 'off', // HTML context makes this tricky
        'no-unused-vars': 'off'
      }
    },
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js',
    'website/css/',
    'coverage/'
  ]
};