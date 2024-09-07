import { User } from "../models/User";
import { verifyToken } from "../services/tokenServices";
import { AppError } from "../utils/AppError";

export async function checkAuthBasic(req, res, next) {
  let token: string | undefined;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  try {
    const decoded = verifyToken(token)
    const currentUser = await User.findOne({ email: decoded.email });
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
}
export async function checkAuthPro(req, res, next) {

}