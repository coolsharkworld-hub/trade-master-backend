import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import createCartRouter from './routes/cart';
import createAuthRouter from './routes/auth';
import swaggerSpec from './config/swagger';
import createPaymentRouter from './routes/payment';
import logger from './config/logger';
import { db, dbConfig } from './config/database';

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-key-change-this-in-production';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
};

app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(
      parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check and docs
    return req.path === '/health' || req.path.startsWith('/api-docs');
  },
});

app.use(limiter);

// Body parsing middleware
app.use(
  express.json({
    limit: process.env.JSON_LIMIT || '10mb',
    strict: true,
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URL_ENCODED_LIMIT || '10mb',
    parameterLimit: parseInt(process.env.URL_ENCODED_PARAMETER_LIMIT || '1000'),
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`,
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    );
  });

  next();
});

// Swagger Documentation
const swaggerOptions = {
  explorer: true,
  customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Course Management API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
};

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions),
);

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
try {
  const cartRoutes = createCartRouter(db, JWT_SECRET);
  const authRoutes = createAuthRouter(db, JWT_SECRET);
  const paymentRoutes = createPaymentRouter();

  app.use('/api/cart', cartRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/payment', paymentRoutes);

  logger.info('All routes initialized successfully');
} catch (error) {
  logger.error('Error initializing routes:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      success: true,
      message: 'Server is running and healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
      database: {
        status: 'connected',
        host: dbConfig.host,
        database: dbConfig.database,
      },
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Server is unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// Global error handling middleware
app.use((error: unknown, req: express.Request, res: express.Response) => {
  // Convert unknown error to a more usable type
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDevelopment = NODE_ENV === 'development';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: isDevelopment ? err.message : 'Invalid input data',
    });
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: isDevelopment ? err.message : 'Invalid or expired token',
    });
  }

  // For error.code, we need to check if it's an object with code property
  const errorWithCode = error as { code?: string };
  if (errorWithCode.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'Request entity too large',
    });
  }

  // For status/statusCode, check if they exist on the error object
  const errorWithStatus = error as { status?: number; statusCode?: number };
  const status = errorWithStatus.status || errorWithStatus.statusCode || 500;

  // Generic error response
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDevelopment && {
      stack: err.stack,
      details: error,
    }),
  });
});

export default app;
