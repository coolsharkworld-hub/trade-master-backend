import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Trade Master API',
    version: '1.0.0',
    description:
      'A comprehensive API for managing courses, users, and shopping cart functionality',
    contact: {
      name: 'API Support',
      email: 'support@courseapi.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://api.coursemanagement.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in the format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'email', 'role', 'isActive'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the user',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            description: 'User role',
            example: 'user',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the user account is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Course: {
        type: 'object',
        required: ['id', 'description', 'price', 'isNew', 'included'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the course',
            example: 1,
          },
          logo: {
            type: 'string',
            description: 'URL to course logo image',
            example: 'https://example.com/logo.png',
          },
          description: {
            type: 'string',
            description: 'Course description',
            example: 'Learn React from basics to advanced',
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Course price',
            example: 599.99,
          },
          isNew: {
            type: 'boolean',
            description: 'Whether the course is newly added',
            example: true,
          },
          included: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of what is included in the course',
            example: ['Video lectures', 'Assignments', 'Certificate'],
          },
          image: {
            type: 'string',
            description: 'URL to course main image',
            example: 'https://example.com/course-image.jpg',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Course creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      CartItem: {
        type: 'object',
        required: ['id', 'userId', 'courseId', 'addedAt', 'course'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the cart item',
            example: 1,
          },
          userId: {
            type: 'integer',
            description: 'ID of the user who owns this cart item',
            example: 1,
          },
          courseId: {
            type: 'integer',
            description: 'ID of the course in the cart',
            example: 1,
          },
          addedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the item was added to cart',
          },
          course: {
            $ref: '#/components/schemas/Course',
          },
        },
      },
      CartSummary: {
        type: 'object',
        required: [
          'itemCount',
          'totalPrice',
          'averagePrice',
          'newCoursesCount',
        ],
        properties: {
          itemCount: {
            type: 'integer',
            description: 'Total number of items in cart',
            example: 3,
          },
          totalPrice: {
            type: 'number',
            format: 'float',
            description: 'Total price of all items in cart',
            example: 1799.97,
          },
          averagePrice: {
            type: 'number',
            format: 'float',
            description: 'Average price per item',
            example: 599.99,
          },
          newCoursesCount: {
            type: 'integer',
            description: 'Number of new courses in cart',
            example: 2,
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password',
            example: 'securePassword123',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'newuser@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'User password (minimum 6 characters)',
            example: 'securePassword123',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            description: 'User role (only admins can set this)',
            example: 'user',
          },
        },
      },
      CreateCourseRequest: {
        type: 'object',
        required: ['description', 'price', 'included'],
        properties: {
          logo: {
            type: 'string',
            description: 'URL to course logo image',
            example: 'https://example.com/logo.png',
          },
          description: {
            type: 'string',
            description: 'Course description',
            example: 'Learn React from basics to advanced',
          },
          price: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Course price',
            example: 599.99,
          },
          isNew: {
            type: 'boolean',
            description: 'Whether the course is newly added',
            example: true,
          },
          included: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of what is included in the course',
            example: ['Video lectures', 'Assignments', 'Certificate'],
          },
          image: {
            type: 'string',
            description: 'URL to course main image',
            example: 'https://example.com/course-image.jpg',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Response message',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          error: {
            type: 'string',
            description: 'Error message (only present when success is false)',
            example: 'Validation error',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'An error occurred',
          },
          error: {
            type: 'string',
            description: 'Detailed error information',
            example: 'Validation failed',
          },
        },
      },
      CreatePayment: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          amount: {
            type: 'integer',
            minimum: 0,
            examples: 15,
          },
          currency: {
            type: 'string',
          },
          error: {
            type: 'string',
            description: 'Detailed error information',
            example: 'Validation failed',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Authentication failed',
              error: 'Invalid or expired token',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access denied - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Access denied',
              error: 'Insufficient permissions',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Resource not found',
              error: 'The requested resource does not exist',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Validation error',
              error: 'Invalid input data',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
