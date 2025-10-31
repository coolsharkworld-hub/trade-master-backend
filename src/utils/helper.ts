import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

export const generateToken = (id: number, email: string) => {
  return jwt.sign({ userId: id, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  } as SignOptions);
};
