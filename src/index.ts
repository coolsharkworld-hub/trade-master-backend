// src/index.ts - Updated with Swagger integration
import dotenv from 'dotenv';

import logger from './config/logger';
import app from './app';
import { db, dbConfig } from './config/database';

// Load environment variables
dotenv.config();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!process.env.JWT_SECRET && NODE_ENV === 'production') {
  logger.error('JWT_SECRET environment variable is required in production');
  process.exit(1);
}

// Test database connection
db.connect()
  .then((client) => {
    logger.info('Connected to PostgreSQL database successfully');
    logger.info(
      `Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`,
    );
    client.release();
  })
  .catch((error) => {
    logger.error('Database connection error:', error);
    logger.error(
      'Please check your database configuration and ensure PostgreSQL is running',
    );
    process.exit(1);
  });

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close database connections
  try {
    await db.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }

  // Exit process
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/api`);
  logger.info(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
  logger.info(`📄 OpenAPI JSON: http://localhost:${PORT}/api-docs.json`);

  if (NODE_ENV === 'development') {
    logger.info(`🛠️  Development mode - CORS allows all origins`);
  }
});

// Handle server errors
server.on('error', (error: Error) => {
  logger.error('Server error:', error);
  process.exit(1);
});
