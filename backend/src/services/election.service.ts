import { Election, Candidate, Vote } from '../models/index.js';
import { ApiError } from '../utils/api-error.js';
import { Types } from 'mongoose';

export class ElectionService {
  async getElections(schoolId: string) {
    return Election.find({ schoolId }).sort({ createdAt: -1 });
  }

  async createElection(schoolId: string, data: any) {
    return Election.create({ ...data, schoolId });
  }

  async getCandidates(electionId: string) {
    return Candidate.find({ electionId }).sort({ votes: -1 });
  }

  async addCandidate(schoolId: string, electionId: string, data: any) {
    return Candidate.create({ ...data, schoolId, electionId });
  }

  async castVote(schoolId: string, electionId: string, candidateId: string, studentId: string) {
    // Prevent double voting
    const existing = await Vote.findOne({ electionId, studentId });
    if (existing) throw new ApiError(409, 'You have already voted in this election');

    // Cast the vote
    await Vote.create({
      schoolId: new Types.ObjectId(schoolId),
      electionId: new Types.ObjectId(electionId),
      candidateId: new Types.ObjectId(candidateId),
      studentId: new Types.ObjectId(studentId),
    });

    // Increment candidate vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    return { success: true, message: 'Vote cast successfully' };
  }
}
