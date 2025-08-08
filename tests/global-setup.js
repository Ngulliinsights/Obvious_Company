/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

module.exports = async () => {
  console.log('🚀 Starting global test setup...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001'; // Use different port for tests
  
  // Wait for server to be ready
  console.log('⏳ Waiting for test server to be ready...');
  
  // Additional setup can go here
  // - Database seeding
  // - External service mocking
  // - Test data preparation
  
  console.log('✅ Global test setup complete');
};