import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';

export function requireFeature(featureName: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Allow SUPER_ADMIN to bypass feature gating checks
      if (req.user?.role === 'SUPER_ADMIN') {
        return next();
      }

      const schoolId = req.schoolId || req.user?.schoolId;

      if (!schoolId) {
        return next(new ApiError(400, "School scope required to check feature access"));
      }

      // Check overrides on school model directly
      if (req.school?.featureOverrides && req.school.featureOverrides[featureName] === false) {
        return next(new ApiError(403, `Feature '${featureName}' has been disabled for this school`));
      }
      if (req.school?.featureOverrides && req.school.featureOverrides[featureName] === true) {
        return next();
      }

      // Find active or trialing subscription for this school
      const subscription = await Subscription.findOne({
        schoolId,
        status: { $in: ['ACTIVE', 'TRIALING'] },
      });

      if (!subscription) {
        return next(new ApiError(402, "No active subscription found for this school"));
      }

      // Resolve via SubscriptionPlan features
      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (!plan || !plan.features.includes(featureName)) {
        return next(new ApiError(403, `Your current subscription plan does not support the '${featureName}' feature`));
      }

      next();
    } catch (error) {
      next(new ApiError(500, "Error evaluating feature toggle permissions"));
    }
  };
}
