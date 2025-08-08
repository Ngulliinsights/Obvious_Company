const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Global test timeout
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Emulate user preferences
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },
    
    // Tablet
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] }
    }
  ],
  
  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd website/server && npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  
  // Output directory
  outputDir: 'test-results/',
  
  // Global setup/teardown
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js')
});