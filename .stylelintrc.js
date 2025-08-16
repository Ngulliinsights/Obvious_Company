module.exports = {
  extends: ['stylelint-config-recommended'],
  rules: {
    // Disable temporarily while fixing issues
    'declaration-block-single-line-max-declarations': null,
    'no-duplicate-selectors': null,

    // Color and values
    'color-hex-case': null,
    'color-hex-length': 'long',
    'color-no-invalid-hex': true,

    // At-rules
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['extend'],
      },
    ],

    // Keyframes
    'keyframes-name-pattern': null,

    // Vendor prefixes
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,

    // Custom properties
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'custom-property-empty-line-before': null,

    // Declaration blocks
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-shorthand-property-overrides': true,

    // Functions
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,

    // Selector pattern
    'selector-no-qualifying-type': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'function-url-quotes': 'always',

    // Media queries
    'media-feature-name-no-unknown': true,

    // Selectors
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'selector-id-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'selector-pseudo-class-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,
    'selector-type-no-unknown': true,

    // Units
    'unit-no-unknown': true,
    'length-zero-no-unit': true,

    // Values
    'value-keyword-case': 'lower',

    // At-rules
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen'],
      },
    ],

    // Disable some rules that conflict with our CSS architecture
    'no-descending-specificity': null,
    'selector-class-pattern': null, // Allow BEM and other patterns
    'alpha-value-notation': null,
    'color-function-notation': null,

    // Allow CSS custom properties
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes', 'compose-with'],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  ignoreFiles: ['node_modules/**/*', 'dist/**/*', 'build/**/*', '**/*.min.css', 'coverage/**/*'],
};
