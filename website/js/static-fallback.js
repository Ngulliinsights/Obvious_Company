// Static fallback for form submissions when server is not available
function handleStaticFormSubmission(event) {
  event.preventDefault();
  const config = require('./config');

  if (config.isStatic) {
    const email = document.querySelector('input[type="email"]')?.value;
    const message =
      'This is a static version of the website. Please visit our main site for full functionality.';

    // Store in localStorage for demonstration
    if (email) {
      localStorage.setItem(
        'lastFormSubmission',
        JSON.stringify({
          email,
          timestamp: new Date().toISOString(),
          message: 'Form submission saved locally',
        })
      );
    }

    alert(message);
    return false;
  }

  // If not static, allow normal form submission
  return true;
}

// Apply to all forms
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleStaticFormSubmission);
  });
});
