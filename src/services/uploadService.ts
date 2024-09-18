import multer from 'multer'
import {v2 as cloudinary} from 'cloudinary'
import { AppError } from '../utils/AppError';
import dotenv from 'dotenv'
dotenv.config();
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only images are allowed.', 400), false);
    }
  },
});
export async function uploadToCloudinary(path : string) {
  try {

    const result = await cloudinary.uploader.upload(path , {
      folder:'ideas_app'
    });
    return result.secure_url
  }
  catch(err:any) {
    throw new Error(err.message || 'Failed to Uplaod')
  }
}