import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { ApiKey } from '../models/ApiKey.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function generateApiKey(req: Request, res: Response) {
  const { name, expiresAt } = req.body;
  // Use user's schoolId from auth middleware
  const schoolId = req.user?.schoolId || req.body.schoolId;

  if (!schoolId) {
    return sendResponse(res, 400, 'School ID is required', null);
  }

  if (!name) {
    return sendResponse(res, 400, 'API key name is required', null);
  }

  // Generate a random 32-byte key and base64url encode it
  const rawKey = crypto.randomBytes(32).toString('base64url');
  
  // Format the key to have a prefix for easier identification, e.g., sk_live_...
  const formattedKey = `sk_live_${rawKey}`;
  
  // Hash the full key for storage
  const keyHash = crypto.createHash('sha256').update(formattedKey).digest('hex');
  
  const prefix = formattedKey.substring(0, 12); // store 'sk_live_...' prefix
  const createdBy = (req.user as any)?.id || (req.user as any)?._id;

  const apiKey = await ApiKey.create({
    schoolId,
    name,
    keyHash,
    prefix,
    expiresAt,
    createdBy
  });

  return sendResponse(res, 201, 'API key generated successfully', {
    ...apiKey.toObject(),
    // We only show the full key once during creation
    key: formattedKey 
  });
}

export async function listApiKeys(req: Request, res: Response) {
  const schoolId = req.user?.schoolId || req.query.schoolId;
  
  if (!schoolId) {
    return sendResponse(res, 400, 'School ID is required', null);
  }

  const apiKeys = await ApiKey.find({ schoolId: new Types.ObjectId(schoolId as string) }).sort({ createdAt: -1 });
    return sendResponse(res, 200, 'API keys retrieved successfully', apiKeys);
}

export async function revokeApiKey(req: Request, res: Response) {
  const { id } = req.params;
  const schoolId = req.user?.schoolId || req.body.schoolId;

  const apiKey = await ApiKey.findOneAndUpdate(
    { _id: id, schoolId },
    { isActive: false },
    { new: true }
  );

  if (!apiKey) {
    return sendResponse(res, 404, 'API key not found', null);
  }

  return sendResponse(res, 200, 'API key revoked successfully', apiKey);
}
