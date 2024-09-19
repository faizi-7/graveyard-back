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
  const htmlContent = `<h1>Dont click the link below if the you havent sent this mail!</h1>
        <br>
        <p>CAUTION 🚫</p>
        <br>
        <a href="https://graveyard-back-production.up.railway.app/api/auth/verifymailtoken?emailToken=${emailToken}">Click here to verify</a>`;

  await sendMail({ email, subject, htmlContent });
};
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const subject = 'Reset your password';
  const htmlContent = `<p>You requested a password reset. Click on the link below to reset your password:</p>
        <br>
        <a href="https://graveyard-back-production.up.railway.app/api/auth/verifypasstoken?resetToken=${resetToken}">Reset Password Here</a>`;

  await sendMail({ email, subject, htmlContent });
};



// Send Contact Email from User to me
interface ContactMailOptions {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export const sentContactMail = async (mailOptions: ContactMailOptions) => {
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
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Failed to send email', 500);
  }
};