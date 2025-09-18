module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  doubleQuote: false,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Line length
  printWidth: 100,
  
  // Spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // HTML/CSS specific
  htmlWhitespaceSensitivity: 'css',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.html',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
        bracketSameLine: true
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 120,
        singleQuote: false
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: ['package.json', 'package-lock.json'],
      options: {
        tabWidth: 2
      }
    }
  ]
};