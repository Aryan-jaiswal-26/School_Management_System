import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { School } from '../models/School.js';
import { ApiError } from '../utils/api-error.js';

declare global {
  namespace Express {
    interface Request {
      schoolId?: string;
      school?: any;
    }
  }
}

export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check custom headers first (useful for testing, mobile apps, or API testing)
    const schoolCodeHeader = req.headers['x-school-code'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string;

    if (tenantIdHeader && mongoose.Types.ObjectId.isValid(tenantIdHeader)) {
      const school = await School.findOne({ _id: tenantIdHeader, isActive: true });
      if (school) {
        req.school = school;
        req.schoolId = school._id.toString();
        return next();
      }
    }

    if (schoolCodeHeader) {
      const school = await School.findOne({ code: schoolCodeHeader.toUpperCase(), isActive: true });
      if (school) {
        req.school = school;
        req.schoolId = school._id.toString();
        return next();
      }
    }

    // 2. Resolve via host / domain names (subdomain mapping)
    const host = req.headers.host || '';
    const parts = host.split('.');
    
    // Check if it's a subdomain (e.g. school1.localhost:5000 or school1.campusos.com)
    if (parts.length > 2 || (host.includes('localhost') && parts.length > 1)) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'api') {
        const school = await School.findOne({ subdomain: subdomain.toLowerCase(), isActive: true });
        if (school) {
          req.school = school;
          req.schoolId = school._id.toString();
          return next();
        }
      }
    }

    // 3. Check if there's a custom domain match
    const schoolByCustomDomain = await School.findOne({ customDomain: host.toLowerCase(), isActive: true });
    if (schoolByCustomDomain) {
      req.school = schoolByCustomDomain;
      req.schoolId = schoolByCustomDomain._id.toString();
      return next();
    }

    // 4. Fallback to user session tenant if token has been verified (which will be processed in auth middleware)
    next();
  } catch (error: any) {
    console.error("Tenant resolution error details:", error);
    next(new ApiError(500, "Error resolving tenant context", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    }));
  }
}

/**
 * Middleware that strictly blocks any request that could not resolve a valid tenant.
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  // SUPER_ADMIN does not need to be bound to a specific school tenant for global endpoints,
  // but if the endpoint is school-scoped, they should provide schoolId or header
  if (!req.schoolId && req.user?.role !== 'SUPER_ADMIN') {
    return next(new ApiError(400, "School scope required. Please specify a subdomain, custom domain, or X-Tenant-ID header."));
  }
  next();
}
