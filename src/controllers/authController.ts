import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { validateEmail, validateLogin, validatePassword, validateRegister, validateToken } from '../validators/authValidators';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { signToken, verifyToken } from '../services/tokenServices';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/mailService';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    validateRegister.parse(req.body)
    const { username, email, password } = req.body
    const exists = await User.findOne({ email })
    if (exists) {
      return next(new AppError('User Already Exists', 403))
    }
    const user = new User({ username, email, password })
    await user.save()
    res.status(201).send(`User Registered with id - ${user._id, user.password}`)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ')
      next(new AppError(message, 400))
    } else {
      next(new AppError(err.message || 'Unable to register at the moment', 500))
    }
  }
}


export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    validateLogin.parse(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('User does not exist', 401));
    }
    const passCheck = await user.comparePassword(password);
    if (!passCheck) {
      return next(new AppError('Invalid credentials', 401));
    }
    const token = signToken(user.email)

    return res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ')
      next(new AppError(message, 400))
    } else {
      next(new AppError(err.message || 'Unable to login at the moment', 500))
    }
  }
}

export const verifyEmailToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailToken } = req.query;
    const parsed = validateToken.safeParse(emailToken)
    if (!parsed.success) throw new AppError('Token length is very smol', 400)

    if (!emailToken || Array.isArray(emailToken)) {
      throw new AppError('Token is missing or invalid', 400);
    }

    const decoded = verifyToken(emailToken as string)
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.emailVerified = true;
    await user.save();

    res.status(200).json({
      message: 'Email successfully verified',
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateEmail.parse(req.body)
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const emailToken = signToken(user.email)

    await sendVerificationEmail(email, emailToken as string);

    res.status(200).json({
      message: 'Verification email sent successfully',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ')
      next(new AppError(message, 400))
    } else {
      next(new AppError(err.message || 'Unable to send verification email at the moment', 500))
    }
  }
}

// Password Reset Section
// Flow of Control
// initiatePasswordReset -> verifyPasswordToken -> resetPassword

// Step 1
export const initiatePasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateEmail.parse(req.body);
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user)
      throw new AppError('User not found', 404);

    if (!user.emailVerified)
      throw new AppError('Unauthorised (Either you havent verified your account or you are trying to hack another one!)', 400)
    await user.save()
    const securityKey = process.env.PASS_RESET_KEY || ''
    if (!securityKey) throw new AppError('Security Key Missing', 500)
    const resetToken = jwt.sign({ email }, securityKey, { expiresIn: '20m' })

    await sendPasswordResetEmail(email, resetToken as string);

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to send password reset email', 500));
    }
  }
};

// Step 2
export const verifyPasswordToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken } = req.query;

    if (!resetToken || Array.isArray(resetToken)) {
      throw new AppError('Reset token is missing or invalid', 400);
    }

    const securityKey = process.env.PASS_RESET_KEY || ''
    if (!securityKey) throw new AppError('Security Key Missing', 500)
    const decoded = jwt.verify(resetToken as string, securityKey) as {
      email: string;
      iat: number;
      exp: number;
    }
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      resetToken : resetToken,
      message: 'Password reset successfully',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to reset password', 500));
    }
  }
};

// Step 3
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || Array.isArray(resetToken)) {
      throw new AppError('Reset token is missing or invalid', 400);
    }

    validatePassword.parse({ password: newPassword });

    const securityKey = process.env.PASS_RESET_KEY || ''
    if (!securityKey) throw new AppError('Security Key Missing', 500)
    const decoded = jwt.verify(resetToken as string, securityKey) as {
      email: string;
      iat: number;
      exp: number;
    }
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to reset password', 500));
    }
  }
};
