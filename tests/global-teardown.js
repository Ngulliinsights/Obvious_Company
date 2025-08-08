/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */

module.exports = async () => {
  console.log('🧹 Starting global test teardown...');
  
  // Cleanup can go here
  // - Database cleanup
  // - Temporary file removal
  // - External service cleanup
  
  console.log('✅ Global test teardown complete');
};