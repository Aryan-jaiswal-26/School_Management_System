import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToStorage(file: Express.Multer.File, folder = 'school-management') {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'auto',
    });

    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
      fileName: file.originalname,
    };
  }

  return {
    url: `http://localhost:5004/uploads/${folder ? `${folder}/` : ''}${file.filename}`,
    publicId: null,
    provider: 'local',
    fileName: file.originalname,
  };
}
