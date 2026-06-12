import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { ApiKey } from '../models/ApiKey.js';
import { sendResponse } from '../utils/response.js';
import { School } from '../models/School.js';

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyHeader = req.headers['x-api-key'] as string;

    if (!apiKeyHeader) {
      return sendResponse(res, 401, 'API key missing', null);
    }

    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

    const apiKey = await ApiKey.findOne({ keyHash, isActive: true });

    if (!apiKey) {
      return sendResponse(res, 401, 'Invalid API key', null);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return sendResponse(res, 401, 'API key has expired', null);
    }

    // Attach school to request for downstream controllers
    const school = await School.findById(apiKey.schoolId);
    if (!school) {
      return sendResponse(res, 401, 'School associated with this key not found', null);
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    // Attach API integration identity to the request
    req.user = {
      _id: apiKey._id as any, // Pseudo user ID for auditing purposes
      role: 'SUPER_ADMIN' as any, // Give it necessary roles or handle specifically
      schoolId: apiKey.schoolId as any,
    } as any;

    next();
  } catch (error) {
    return sendResponse(res, 500, 'Error verifying API key', null);
  }
};
