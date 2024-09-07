import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError';
interface MailOptions {
  email: string;
  subject: string;
  htmlContent: string;
}
const sendMail = async ({ email, subject, htmlContent }: MailOptions) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "itsfaiziqbal@gmail.com",
      pass: process.env.GMAIL_PASS || "",
    },
  });

  const mailOptions = {
    from: '"ifaiz ideas" <itsfaiziqbal@gmail.com>',
    to: email,
    subject,
    html: htmlContent,
  };


  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error: any) {
    console.error('Error sending email: ', error);
    throw new AppError(`Error sending email : ${error.message || ""}`, 500)
  }
};

export const sendVerificationEmail = async (email: string, emailToken: string) => {
  const subject = 'Please verify your email...';
  const htmlContent = `<p>Hello, verify your email address by clicking on this</p>
        <br>
        <a href="http://localhost:3000/api/auth/verifymailtoken?emailToken=${emailToken}">Click here to verify</a>`;

  await sendMail({ email, subject, htmlContent });
};
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const subject = 'Reset your password';
  const htmlContent = `<p>You requested a password reset. Click on the link below to reset your password:</p>
        <br>
        <a href="http://localhost:3000/api/auth/verifypasstoken?resetToken=${resetToken}">Reset Password Here</a>`;

  await sendMail({ email, subject, htmlContent });
};