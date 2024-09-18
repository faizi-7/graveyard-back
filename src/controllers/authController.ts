import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { validateAuthUpgrade, validateEmail, validateLogin, validateMailOptions, validatePassword, validateRegister, validateToken } from '../validators/authValidators';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { signToken, verifyToken } from '../services/tokenServices';
import { sendPasswordResetEmail, sendVerificationEmail, sentContactMail } from '../services/mailService';
import { uploadToCloudinary } from '../services/uploadService';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -email')
      .populate('favorites');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      data: user,
      message: 'User fetched successfully'
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to fetch user', 500));
  }
};

export async function grantUser(req, res: Response) {
  const user = req.user;
  res.status(200).json({
    message: 'Protected data access granted',
    data: user,
  });
};


export async function register(req, res: Response, next: NextFunction) {
  try {
    const parsedData = validateRegister.parse(req.body)
    let profilePic = ''
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      profilePic = await uploadToCloudinary(`data:image/jpeg;base64,${base64Image}`)
    }
    const exists = await User.findOne({ email: req.body.email })
    if (exists) {
      return next(new AppError('User Already Exists', 403))
    }
    let userData = { ...parsedData }
    if (parsedData.fullname) userData['role'] = 'contributor'
    if (profilePic) userData['profileUrl'] = profilePic
    const user = new User(userData)
    await user.save()

    res.status(201).send({
      message: "Register Successful",
      data: userData
    })
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
      message: 'Login Successful',
      data: token
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

export const upgradeToContributor = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;

    const { fullname, about } = validateAuthUpgrade.parse(req.body);

    const updateData: any = { role: 'contributor', fullname };
    if (about) {
      updateData.about = about
    }
    let profilePic = ''
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      profilePic = await uploadToCloudinary(`data:image/jpeg;base64,${base64Image}`)
      updateData.profileUrl = profilePic
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      message: 'Account Upgraded to Contributor',
      data: updateData
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      return next(new AppError(message, 400));
    }
    next(new AppError(err.message || 'Unable to upgrade account', 500));
  }
};


// Email Verification
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
      message: 'Email Successfully Verified',
      data: {
        userId: user._id,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res: Response, next: NextFunction) => {
  try {
    const { email } = req.user;

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
      message: 'Verification Email Sent Successfully',
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
      message: 'Password Reset Email Sent Successfully',
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

// Step 2 When user clicks on the link in the email token is send to react and it will send the request along with the req.body containing token received from this request
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
      message: 'Password Reset Token Verified',
      data: resetToken,
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
      message: 'Password Reset Successfull',
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


// Send Contact Email :

export const sendContactMail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = validateMailOptions.parse(req.body)

    const mailOptions = {
      from: '"Contact Form" <itsfaiziqbal@gmail.com>',
      to: '"ifaiz ideas" <itsfaiziqbal@gmail.com>',
      replyTo: email,
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await sentContactMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const message: string = err.issues.map(issue => issue.message).join(', ');
      next(new AppError(message, 400));
    } else {
      next(new AppError(err.message || 'Unable to reset password', 500));
    }
  }
};