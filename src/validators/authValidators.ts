import { z } from 'zod';

export const validateRegister = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const validateLogin = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const validateToken = z.string().min(5, 'Must be atleast 5 characters long!')
export const validateEmail = z.object({
  email: z.string().email({ message: "Invalid email address" })
});
export const validatePassword = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long')
});
export const validateResetPassword = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
})