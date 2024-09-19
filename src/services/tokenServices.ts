import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongoose';
import { AppError } from '../utils/AppError';

interface DecodedToken {
  email: string;
  iat: number;
  exp: number;
}
export const signToken = (email: string): string | null => {
  const secretKey = process.env.JWT_PRIVATE_KEY || '';
  try {
    if (!secretKey) {
      return null
    }

    return jwt.sign({ email }, secretKey, {
      expiresIn: '30d',
    });

  } catch (error:any) {
    console.error('Error signing token:', error.message);
    return null;
  }
};


export const verifyToken = (token: string): DecodedToken => {
  const secretKey = process.env.JWT_PRIVATE_KEY || '';
  try {
    if (!secretKey) {
      throw new AppError('JWT secret key is missing', 500);
    }

    return jwt.verify(token, secretKey) as DecodedToken;

  } catch (error: any) {
    throw new AppError('Invalid or expired token', 401);
  }
};
