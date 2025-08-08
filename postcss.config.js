module.exports = {
  plugins: [
    // Import CSS files
    require('postcss-import')({
      path: ['website/css']
    }),
    
    // Enable nested CSS (like Sass)
    require('postcss-nested'),
    
    // Add vendor prefixes automatically
    require('autoprefixer')({
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11'
      ]
    }),
    
    // Minify CSS in production
    ...(process.env.NODE_ENV === 'production' 
      ? [
          require('cssnano')({
            preset: ['default', {
              discardComments: {
                removeAll: true
              },
              normalizeWhitespace: true,
              colormin: true,
              convertValues: true,
              discardDuplicates: true,
              discardEmpty: true,
              mergeRules: true,
              minifyFontValues: true,
              minifyParams: true,
              minifySelectors: true,
              reduceIdents: false, // Keep CSS custom properties
              zindex: false // Don't optimize z-index values
            }]
          })
        ] 
      : []
    )
  ]
};