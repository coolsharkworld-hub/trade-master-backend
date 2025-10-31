// src/services/userService.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  User,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserRole,
  UserDbRow,
} from '../types/user';

export class UserService {
  private db: Pool;
  private jwtSecret: string;
  private saltRounds: number = 10;

  constructor(database: Pool, jwtSecret: string) {
    this.db = database;
    this.jwtSecret = jwtSecret;
  }

  async register(
    userData: RegisterRequest,
    requestingUser?: AuthUser,
  ): Promise<{ user: User; token: string }> {
    const client = await this.db.connect();

    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email],
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        userData.password,
        this.saltRounds,
      );

      // Determine role - only admins can create admin users
      let role: UserRole = 'user';
      if (userData.role === 'admin' && requestingUser?.role === 'admin') {
        role = 'admin';
      }

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, role)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING id, email, first_name, last_name, phone, role, is_active, created_at, updated_at`,
        [
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.phone,
          role,
        ],
      );

      const user = this.mapRowToUser(result.rows[0]);
      const token = this.generateToken(user);

      return { user, token };
    } finally {
      client.release();
    }
  }

  async login(
    credentials: LoginRequest,
  ): Promise<{ user: User; token: string }> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [credentials.email],
      );

      if (result.rows.length === 0) {
        throw new Error('User not exist');
      }

      const userData = result.rows[0];
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        userData.password,
      );

      if (!isValidPassword) {
        throw new Error('Password is invalid');
      }

      const user = this.mapRowToUser(userData);
      const token = this.generateToken(user);

      return { user, token };
    } finally {
      client.release();
    }
  }

  async getUserById(id: number): Promise<User | null> {
    const client = await this.db.connect();

    try {
      const result = await client.query(
        'SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
        [id],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllUsers(requestingUser: AuthUser): Promise<User[]> {
    // Only admins can view all users
    if (requestingUser.role !== 'admin') {
      throw new Error('Access denied');
    }

    const client = await this.db.connect();

    try {
      const result = await client.query(
        'SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC',
      );

      return result.rows.map((row) => this.mapRowToUser(row));
    } finally {
      client.release();
    }
  }

  async updateUserRole(
    userId: number,
    newRole: UserRole,
    requestingUser: AuthUser,
  ): Promise<User> {
    // Only admins can change user roles
    if (requestingUser.role !== 'admin') {
      throw new Error('Access denied');
    }

    const client = await this.db.connect();

    try {
      const result = await client.query(
        `UPDATE users SET role = $1, updated_at = $2 
               WHERE id = $3 
               RETURNING id, email, first_name, last_name, phone, role, is_active, created_at, updated_at`,
        [newRole, new Date(), userId],
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deactivateUser(
    userId: number,
    requestingUser: AuthUser,
  ): Promise<boolean> {
    // Only admins can deactivate users
    if (requestingUser.role !== 'admin') {
      throw new Error('Access denied');
    }

    const client = await this.db.connect();

    try {
      const result = await client.query(
        'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2',
        [new Date(), userId],
      );

      return result.rowCount != null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  private mapRowToUser(row: UserDbRow): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
