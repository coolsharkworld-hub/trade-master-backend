// src/controllers/authController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserRole,
} from '../types/user';
import logger from '../config/logger';

export class AuthController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: RegisterRequest = req.body;

      // Basic validation
      if (!userData.email || !userData.password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        } as AuthResponse);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        } as AuthResponse);
        return;
      }

      // Password validation
      if (userData.password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        } as AuthResponse);
        return;
      }

      const { user, token } = await this.userService.register(
        userData,
        req.user,
      );

      logger.info(`User registered: ${user.email} with role: ${user.role}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
        token,
      } as AuthResponse);
    } catch (error) {
      const err = error as Error;
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: err.message || 'Registration failed',
        error: err.message,
      } as AuthResponse);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginRequest = req.body;

      // Basic validation
      if (!credentials.email || !credentials.password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        } as AuthResponse);
        return;
      }

      const { user, token } = await this.userService.login(credentials);

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user,
        token,
      } as AuthResponse);
    } catch (error) {
      const err = error as Error;
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: err.message || 'Login failed',
        error: err.message,
      } as AuthResponse);
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        } as AuthResponse);
        return;
      }

      const user = await this.userService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as AuthResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        user,
      } as AuthResponse);
    } catch (error) {
      const err = error as Error;
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: err.message,
      } as AuthResponse);
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        } as AuthResponse);
        return;
      }

      const users = await this.userService.getAllUsers(req.user);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        users,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Get all users error:', error);
      res.status(403).json({
        success: false,
        message: err.message || 'Failed to retrieve users',
        error: err.message,
      } as AuthResponse);
    }
  };

  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        } as AuthResponse);
        return;
      }

      const userId = parseInt(req.params.id);
      const { role }: { role: UserRole } = req.body;

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        } as AuthResponse);
        return;
      }

      if (!role || !['user', 'admin'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Valid role is required (user or admin)',
        } as AuthResponse);
        return;
      }

      const updatedUser = await this.userService.updateUserRole(
        userId,
        role,
        req.user,
      );

      logger.info(
        `User role updated: ${updatedUser.email} -> ${role} by ${req.user.email}`,
      );

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: updatedUser,
      } as AuthResponse);
    } catch (error) {
      const err = error as Error;
      logger.error('Update user role error:', error);
      res.status(403).json({
        success: false,
        message: err.message || 'Failed to update user role',
        error: err.message,
      } as AuthResponse);
    }
  };

  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        } as AuthResponse);
        return;
      }

      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        } as AuthResponse);
        return;
      }

      // Prevent self-deactivation
      if (userId === req.user.id) {
        res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        } as AuthResponse);
        return;
      }

      const success = await this.userService.deactivateUser(userId, req.user);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        } as AuthResponse);
        return;
      }

      logger.info(`User deactivated: ID ${userId} by ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
      } as AuthResponse);
    } catch (error) {
      const err = error as Error;
      logger.error('Deactivate user error:', error);
      res.status(403).json({
        success: false,
        message: err.message || 'Failed to deactivate user',
        error: err.message,
      } as AuthResponse);
    }
  };
}
