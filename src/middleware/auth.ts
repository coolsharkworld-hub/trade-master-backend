// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { UserRole } from '../types/user';

interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export class AuthMiddleware {
  private db: Pool;
  private jwtSecret: string;

  constructor(database: Pool, jwtSecret: string) {
    this.db = database;
    this.jwtSecret = jwtSecret;
  }

  // Basic authentication middleware
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token required',
        });
        return;
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;

        // Verify user still exists and is active
        const client = await this.db.connect();
        try {
          const result = await client.query(
            'SELECT id, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId],
          );

          if (result.rows.length === 0 || !result.rows[0].is_active) {
            res.status(401).json({
              success: false,
              message: 'Invalid or expired token',
            });
            return;
          }

          const user = result.rows[0];
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };

          next();
        } finally {
          client.release();
        }
      } catch {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
        return;
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }
  };

  // Admin-only middleware
  requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // First authenticate
    await this.authenticate(req, res, () => {
      if (!req.user) {
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
        return;
      }

      next();
    });
  };

  // Role-based middleware factory
  requireRole = (roles: UserRole[]) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      await this.authenticate(req, res, () => {
        if (!req.user) {
          return;
        }

        if (!roles.includes(req.user.role)) {
          res.status(403).json({
            success: false,
            message: `Access denied. Required roles: ${roles.join(', ')}`,
          });
          return;
        }

        next();
      });
    };
  };
}

// Factory function to create middleware instances
export const createAuthMiddleware = (db: Pool, jwtSecret: string) => {
  return new AuthMiddleware(db, jwtSecret);
};

// Legacy exports for backward compatibility
export const authMiddleware = () => {
  // This should be replaced with actual middleware instance
  throw new Error('Use createAuthMiddleware to create middleware instance');
};
