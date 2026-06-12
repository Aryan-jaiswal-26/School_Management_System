import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Default upload (used for simple routes)
const defaultUploadDir = path.resolve(process.cwd(), 'uploads');
const defaultStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, defaultUploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});
export const upload = multer({ storage: defaultStorage });

// Options for custom uploads (e.g., branding assets)
export interface UploadOptions {
  allowedMimeTypes?: string[];
  maxSize?: number; // bytes
  subFolder?: string; // sub‑directory under ./uploads
}

/**
 * Creates a multer instance with custom validation and storage options.
 * Used by routes that need specific file type/size limits.
 */
export const createUploadFactory = (options: UploadOptions = {}) => {
  const dest = path.resolve(
    process.cwd(),
    'uploads',
    options.subFolder || ''
  );

  const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
      cb(null, dest);
    },
    filename: (req: Request, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${timestamp}-${safeName}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    limits: { fileSize: options.maxSize },
    fileFilter,
  });
};

// Export factory under expected name
export const createUpload = createUploadFactory;
