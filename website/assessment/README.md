# AI Integration Assessment Platform

A comprehensive assessment system for evaluating organizational readiness for AI integration, designed specifically for The Obvious Company's strategic intelligence amplification methodology.

## Features

- **Multi-Modal Assessments**: Support for questionnaires, scenario-based evaluations, conversational assessments, visual pattern recognition, and behavioral observations
- **Cultural Intelligence**: Adaptive assessments that consider East African cultural contexts and business practices
- **Industry Specialization**: Customized evaluation frameworks for different sectors (Financial Services, Manufacturing, Healthcare, Government)
- **Persona Classification**: Intelligent categorization into strategic personas (Architect, Catalyst, Contributor, Explorer, Observer)
- **Curriculum Recommendations**: Personalized learning pathways based on assessment results
- **Real-time Analytics**: Comprehensive tracking and analysis of assessment patterns

## Architecture

### Core Components

- **Assessment Engine**: Manages question flow, cultural adaptations, and progress tracking
- **Persona Classifier**: AI-driven classification system for strategic persona identification
- **Industry Adapter**: Customizes assessments based on sector-specific requirements
- **Curriculum Generator**: Creates personalized learning recommendations
- **Analytics Engine**: Tracks user behavior and assessment effectiveness

### Technology Stack

- **Backend**: Node.js with TypeScript, Express.js
- **Database**: PostgreSQL with Redis for caching
- **Testing**: Vitest with comprehensive test coverage
- **Security**: Helmet.js, CORS, rate limiting, input validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

1. Clone the repository and navigate to the assessment platform:
```bash
cd website/assessment
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb ai_assessment

# The application will run migrations automatically on startup
```

5. Start the development server:
```bash
npm run dev
```

The assessment platform will be available at `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Endpoints

### Health Check
- `GET /api/health` - System health status

### Assessment Management
- `POST /api/assessment/start` - Start new assessment session
- `GET /api/assessment/:sessionId` - Get assessment session details
- `POST /api/assessment/:sessionId/response` - Submit assessment response
- `GET /api/assessment/:sessionId/next` - Get next question
- `POST /api/assessment/:sessionId/complete` - Complete assessment

### User Management
- `POST /api/users` - Create user profile
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile

### Results & Recommendations
- `GET /api/results/:sessionId` - Get assessment results
- `GET /api/recommendations/:sessionId` - Get curriculum recommendations

## Database Schema

The platform uses PostgreSQL with the following main tables:

- `user_profiles` - User demographic and professional information
- `assessment_sessions` - Assessment session tracking
- `assessment_responses` - Individual question responses
- `assessment_results` - Calculated scores and persona classifications
- `curriculum_recommendations` - Personalized learning pathways
- `user_analytics` - Behavioral tracking and engagement metrics
- `industry_configurations` - Industry-specific assessment configurations

## Testing

The platform includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- UserProfile.test.ts
```

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for consistent code style
- Comprehensive error handling with custom error classes
- Structured logging with configurable levels

### Security
- Input validation on all endpoints
- Rate limiting to prevent abuse
- Helmet.js for security headers
- JWT-based authentication (when implemented)
- SQL injection prevention with parameterized queries

### Performance
- Database connection pooling
- Redis caching for frequently accessed data
- Compression middleware
- Efficient database indexes

## Deployment

### Environment Setup
1. Set up PostgreSQL and Redis instances
2. Configure environment variables for production
3. Run database migrations
4. Start the application server

### Docker Support (Future Enhancement)
Docker configuration will be added to support containerized deployments.

## Contributing

1. Follow TypeScript and ESLint configurations
2. Write tests for new features
3. Update documentation for API changes
4. Follow semantic versioning for releases

## License

Proprietary - The Obvious Company