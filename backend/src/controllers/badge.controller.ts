import { Request, Response } from 'express';
import { BadgeService } from '../services/badge.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export class BadgeController {
  static getAllBadges = asyncHandler(async (req: Request, res: Response) => {
    const badges = await BadgeService.getAllBadges();
    res.json(badges);
  });
}
