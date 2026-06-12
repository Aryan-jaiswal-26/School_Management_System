import { Candidate } from '../src/models/Candidate.js';

export class CandidateService {
  /**
   * Retrieve all candidate documents from the database.
   * @returns {Promise<Array>} List of candidates
   */
  static async getAllCandidates() {
    return await Candidate.find();
  }
}
