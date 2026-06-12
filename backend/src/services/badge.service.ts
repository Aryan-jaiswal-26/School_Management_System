import { Badge } from '../models/Badge.js';

export class BadgeService {
  static async getAllBadges() {
    return await Badge.find();
  }
}
