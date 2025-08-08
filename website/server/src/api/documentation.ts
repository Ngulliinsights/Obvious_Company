/**
 * API Documentation Generator
 * Creates interactive API documentation for the assessment platform
 * Requirements: 5.4, 9.4, 10.1
 */

import { Router, Request, Response } from 'express';
import { AssessmentType, PersonaType, AssessmentStatus, QuestionType } from '../types/assessment';

const router = Router();

/**
 * API Documentation Structure
 */
const apiDocumentation = {
  info: {
    title: "AI Integration Assessment Platform API",
    version: "1.0.0",
    description: "Comprehensive RESTful API for assessment functionality, persona classification, and curriculum generation",
    contact: {
      name: "The Obvious Company",
      url: "https://theobviouscompany.com",
      email: "api@theobviouscompany.com"
    }
  },
  servers: [
    {
      url: process.env.WEBSITE_URL || "http://localhost:3000",
      description: "Production server"
    },
    {
      url: "http://localhost:3000",
      description: "Development server"
    }
  ],
  paths: {
    "/api/assessments": {
      post: {
        summary: "Create a new assessment session",
        description: "Initialize a new assessment session with user profile and assessment type",
        tags: ["Assessments"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["assessment_type"],
                properties: {
                  assessment_type: {
                    type: "string",
                    enum: Object.values(AssessmentType),
                    description: "Type of assessment to create"
                  },
                  user_profile: {
                    type: "object",
                    properties: {
                      demographics: {
                        type: "object",
                        properties: {
                          age_range: { type: "string", example: "30-40" },
                          geographic_region: { type: "string", example: "East Africa" },
                          cultural_context: { type: "array", items: { type: "string" }, example: ["kenya", "swahili"] },
                          languages: { type: "array", items: { type: "string" }, example: ["English", "Swahili"] }
                        }
                      },
                      professional: {
                        type: "object",
                        properties: {
                          industry: { type: "string", example: "financial_services" },
                          role_level: { type: "string", example: "executive" },
                          organization_size: { type: "string", example: "large" },
                          decision_authority: { type: "number", minimum: 1, maximum: 10, example: 8 },
                          years_experience: { type: "number", minimum: 0, example: 15 }
                        }
                      }
                    }
                  },
                  cultural_preferences: {
                    type: "array",
                    items: { type: "string" },
                    description: "Cultural adaptation preferences"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Assessment session created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        session_id: { type: "string", format: "uuid" },
                        first_question: { $ref: "#/components/schemas/Question" },
                        progress: {
                          type: "object",
                          properties: {
                            current_step: { type: "number", example: 1 },
                            total_steps: { type: "number", example: 10 },
                            percentage: { type: "number", example: 10 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/ValidationError" },
          429: { $ref: "#/components/responses/RateLimitError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessments/{sessionId}": {
      get: {
        summary: "Get assessment session details",
        description: "Retrieve complete assessment session information including responses and progress",
        tags: ["Assessments"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Assessment session ID"
          }
        ],
        responses: {
          200: {
            description: "Assessment session retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/AssessmentSession" }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      },
      put: {
        summary: "Update assessment session",
        description: "Update assessment session status or metadata",
        tags: ["Assessments"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: Object.values(AssessmentStatus)
                  },
                  metadata: {
                    type: "object",
                    description: "Session metadata updates"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { $ref: "#/components/responses/SuccessMessage" },
          400: { $ref: "#/components/responses/ValidationError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      },
      delete: {
        summary: "Abandon assessment session",
        description: "Mark assessment session as abandoned",
        tags: ["Assessments"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: { $ref: "#/components/responses/SuccessMessage" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessments/{sessionId}/responses": {
      post: {
        summary: "Submit assessment response",
        description: "Submit a response to an assessment question and get the next question",
        tags: ["Responses"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question_id", "response_value"],
                properties: {
                  question_id: { type: "string", format: "uuid" },
                  response_value: {
                    description: "Response value (type depends on question type)",
                    oneOf: [
                      { type: "string" },
                      { type: "number" },
                      { type: "array" },
                      { type: "object" }
                    ]
                  },
                  confidence_level: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "User's confidence in their response (1-10)"
                  },
                  interaction_metadata: {
                    type: "object",
                    description: "Additional interaction data for behavioral analysis"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Response submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    next_question: { $ref: "#/components/schemas/Question" },
                    is_complete: { type: "boolean" },
                    progress: {
                      type: "object",
                      properties: {
                        current_step: { type: "number" },
                        total_steps: { type: "number" },
                        percentage: { type: "number" }
                      }
                    },
                    results: { $ref: "#/components/schemas/AssessmentResults" }
                  }
                }
              }
            }
          },
          400: { $ref: "#/components/responses/ValidationError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          429: { $ref: "#/components/responses/RateLimitError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      },
      get: {
        summary: "Get all responses for session",
        description: "Retrieve all responses submitted for an assessment session",
        tags: ["Responses"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: {
            description: "Responses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AssessmentResponse" }
                    }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessments/{sessionId}/results": {
      get: {
        summary: "Get assessment results",
        description: "Retrieve calculated assessment results including persona classification and recommendations",
        tags: ["Results"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: {
            description: "Results retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        results: { $ref: "#/components/schemas/AssessmentResults" },
                        recommendations: {
                          type: "object",
                          properties: {
                            immediate_actions: { type: "array", items: { type: "string" } },
                            consultation_booking_url: { type: "string", format: "uri" },
                            resource_downloads: { type: "array", items: { type: "string" } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessments/{sessionId}/results/calculate": {
      post: {
        summary: "Calculate assessment results",
        description: "Trigger calculation of assessment results based on submitted responses",
        tags: ["Results"],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: {
            description: "Results calculated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/AssessmentResults" }
                  }
                }
              }
            }
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessment-types": {
      get: {
        summary: "Get available assessment types",
        description: "Retrieve all available assessment types with their metadata",
        tags: ["Assessment Types"],
        responses: {
          200: {
            description: "Assessment types retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: Object.values(AssessmentType) },
                          name: { type: "string" },
                          description: { type: "string" },
                          estimated_duration: { type: "string" },
                          best_for: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/InternalError" }
        }
      }
    },
    "/api/assessments/health": {
      get: {
        summary: "Health check",
        description: "Check the health status of the assessment service",
        tags: ["Health"],
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "healthy" },
                        timestamp: { type: "string", format: "date-time" },
                        services: {
                          type: "object",
                          properties: {
                            assessment_service: { type: "string", example: "operational" },
                            persona_classification: { type: "string", example: "operational" },
                            curriculum_generation: { type: "string", example: "operational" },
                            database: { type: "string", example: "connected" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          503: {
            description: "Service is unhealthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    error: { type: "string", example: "Service unhealthy" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Question: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: Object.values(QuestionType) },
          text: { type: "string" },
          description: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                text: { type: "string" },
                value: { oneOf: [{ type: "string" }, { type: "number" }] }
              }
            }
          },
          validation_rules: { type: "array", items: { type: "object" } },
          weight: { type: "number" },
          dimension: { type: "string" }
        }
      },
      AssessmentSession: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          assessment_type: { type: "string", enum: Object.values(AssessmentType) },
          status: { type: "string", enum: Object.values(AssessmentStatus) },
          responses: { type: "array", items: { $ref: "#/components/schemas/AssessmentResponse" } },
          metadata: { type: "object" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      AssessmentResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          question_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          session_id: { type: "string", format: "uuid" },
          response_value: { description: "Response value (type varies)" },
          response_time_ms: { type: "number" },
          confidence_level: { type: "number", minimum: 1, maximum: 10 },
          metadata: { type: "object" }
        }
      },
      AssessmentResults: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          session_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          overall_score: { type: "number", minimum: 0, maximum: 100 },
          dimension_scores: {
            type: "object",
            properties: {
              strategic_authority: { type: "number", minimum: 0, maximum: 100 },
              organizational_influence: { type: "number", minimum: 0, maximum: 100 },
              resource_availability: { type: "number", minimum: 0, maximum: 100 },
              implementation_readiness: { type: "number", minimum: 0, maximum: 100 },
              cultural_alignment: { type: "number", minimum: 0, maximum: 100 }
            }
          },
          persona_classification: {
            type: "object",
            properties: {
              primary_persona: { type: "string", enum: Object.values(PersonaType) },
              confidence_score: { type: "number", minimum: 0, maximum: 1 },
              secondary_characteristics: { type: "array", items: { type: "string" } },
              persona_description: { type: "string" }
            }
          },
          recommendations: {
            type: "object",
            properties: {
              program_recommendation: { type: "string" },
              service_tier_recommendation: { type: "string" },
              next_steps: { type: "array", items: { type: "string" } },
              timeline_suggestion: { type: "string" },
              resource_requirements: { type: "array", items: { type: "string" } },
              investment_range: { type: "string" }
            }
          },
          curriculum_pathway: { type: "object" },
          created_at: { type: "string", format: "date-time" },
          calculated_at: { type: "string", format: "date-time" }
        }
      }
    },
    responses: {
      SuccessMessage: {
        description: "Operation completed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                message: { type: "string" }
              }
            }
          }
        }
      },
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Validation failed" },
                details: { type: "array", items: { type: "object" } }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Resource not found" }
              }
            }
          }
        }
      },
      RateLimitError: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Too many requests" },
                code: { type: "string", example: "RATE_LIMIT_EXCEEDED" },
                retryAfter: { type: "number", example: 900 }
              }
            }
          }
        }
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                error: { type: "string", example: "Internal server error" }
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key"
      }
    }
  },
  tags: [
    {
      name: "Assessments",
      description: "Assessment session management"
    },
    {
      name: "Responses",
      description: "Assessment response handling"
    },
    {
      name: "Results",
      description: "Assessment results and calculations"
    },
    {
      name: "Assessment Types",
      description: "Available assessment types and metadata"
    },
    {
      name: "Health",
      description: "Service health monitoring"
    }
  ]
};

/**
 * Serve API documentation as JSON
 */
router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(apiDocumentation);
});

/**
 * Serve interactive API documentation (Swagger UI)
 */
router.get('/', (req: Request, res: Response) => {
  const swaggerUiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Integration Assessment Platform API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #2E5BBA;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: white;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add any default headers or authentication here
          return request;
        },
        responseInterceptor: function(response) {
          // Handle responses here if needed
          return response;
        }
      });
    };
  </script>
</body>
</html>
  `;
  
  res.send(swaggerUiHtml);
});

/**
 * API testing interface
 */
router.get('/test', (req: Request, res: Response) => {
  const testingHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Testing Interface</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
    .get { background: #61affe; }
    .post { background: #49cc90; }
    .put { background: #fca130; }
    .delete { background: #f93e3e; }
    button { background: #2E5BBA; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1e4a9a; }
    textarea { width: 100%; height: 100px; margin: 10px 0; }
    .response { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Integration Assessment Platform API Testing</h1>
    
    <div class="endpoint">
      <h3><span class="method post">POST</span> /api/assessments</h3>
      <p>Create a new assessment session</p>
      <textarea id="create-assessment-body" placeholder="Request body (JSON)">
{
  "assessment_type": "questionnaire",
  "user_profile": {
    "professional": {
      "industry": "financial_services",
      "role_level": "executive"
    }
  }
}
      </textarea>
      <button onclick="testEndpoint('POST', '/api/assessments', 'create-assessment-body', 'create-assessment-response')">Test</button>
      <div id="create-assessment-response" class="response"></div>
    </div>

    <div class="endpoint">
      <h3><span class="method get">GET</span> /api/assessment-types</h3>
      <p>Get available assessment types</p>
      <button onclick="testEndpoint('GET', '/api/assessment-types', null, 'assessment-types-response')">Test</button>
      <div id="assessment-types-response" class="response"></div>
    </div>

    <div class="endpoint">
      <h3><span class="method get">GET</span> /api/assessments/health</h3>
      <p>Health check</p>
      <button onclick="testEndpoint('GET', '/api/assessments/health', null, 'health-response')">Test</button>
      <div id="health-response" class="response"></div>
    </div>
  </div>

  <script>
    async function testEndpoint(method, url, bodyElementId, responseElementId) {
      const responseElement = document.getElementById(responseElementId);
      responseElement.innerHTML = 'Loading...';
      
      try {
        const options = {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        if (bodyElementId) {
          const bodyElement = document.getElementById(bodyElementId);
          options.body = bodyElement.value;
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        responseElement.innerHTML = \`
          <strong>Status:</strong> \${response.status} \${response.statusText}<br>
          <strong>Response:</strong><br>
          <pre>\${JSON.stringify(data, null, 2)}</pre>
        \`;
      } catch (error) {
        responseElement.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
      }
    }
  </script>
</body>
</html>
  `;
  
  res.send(testingHtml);
});

export { router as documentationRoutes };