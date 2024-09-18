import { z } from 'zod';

export const validateRegister = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullname : z.string().min(1, 'Full Name must be at least a character long').optional(),
  about : z.string().min(3, 'Minimum 3 character long about is required!').optional()
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
export const validateAuthUpgrade= z.object({
  fullname: z.string().min(3, 'Fullname is required and should be at least 3 characters long'),
  about: z.string().min(3, 'About should be at least 3 characters long').optional(),
});

export const validateMailOptions= z.object({
  name : z.string().min(1, 'Name must be alteast a character long'),
  email: z.string().email('Invalid email address'),
  message : z.string().min(10, 'Name must be alteast a character long'),
})