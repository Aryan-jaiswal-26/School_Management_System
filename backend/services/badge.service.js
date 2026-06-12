import { Badge } from '../src/models/Badge.js';

export class BadgeService {
  /**
   * Retrieve all badge documents from the database.
   * @returns {Promise<Array>} List of badges
   */
  static async getAllBadges() {
    return await Badge.find();
  }
}
