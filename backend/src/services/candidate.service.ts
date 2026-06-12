import { Candidate } from '../models/Candidate.js';

export class CandidateService {
  static async listCandidates() {
    return await Candidate.find({});
  }
}
