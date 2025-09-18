module.exports = {
  // JavaScript files
  '*.js': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // CSS files
  '*.css': [
    'stylelint --fix',
    'prettier --write',
    'git add'
  ],
  
  // HTML files
  '*.html': [
    'htmlhint',
    'prettier --write',
    'git add'
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
    'git add'
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    'git add'
  ],
  
  // Environment files (check for secrets)
  '.env*': [
    'echo "⚠️  Warning: Environment file changed. Make sure no secrets are committed!"'
  ]
};