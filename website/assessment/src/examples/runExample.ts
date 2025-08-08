import { runContextualRecommendationExamples } from './ContextualRecommendationExample';

// Run the examples
runContextualRecommendationExamples()
  .then(() => {
    console.log('\n=== Examples completed successfully ===');
  })
  .catch((error) => {
    console.error('Error running examples:', error);
  });