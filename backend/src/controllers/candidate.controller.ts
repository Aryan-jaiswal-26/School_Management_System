import { CandidateService } from '../../services/candidate.service.js';
import { Student } from '../models/Student.js';
import { asyncHandler } from '../../utils/async-handler.js';

export class CandidateController {
  static getAllCandidates = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.json([]);
    }

    const student = await Student.findOne({ userId });
    if (!student || !student.classId) {
      // Fallback to generic candidates if not a student or no class assigned
      const candidates = await CandidateService.listCandidates();
      return res.json(candidates);
    }

    // Aggregate votes for each classmate
    const voteCounts = await Student.aggregate([
      { $match: { classId: student.classId, votedFor: { $ne: null } } },
      { $group: { _id: '$votedFor', count: { $sum: 1 } } }
    ]);
    const voteMap = new Map(voteCounts.map(v => [v._id.toString(), v.count]));

    const classmates = await Student.find({ classId: student.classId }).populate('userId');
    const candidates = classmates.map(c => {
      const userDoc = c.userId;
      const cIdStr = c._id.toString();
      return {
        id: cIdStr,
        name: `${userDoc?.firstName || 'Unknown'} ${userDoc?.lastName || ''}`.trim(),
        grade: 'Classmate',
        avatar: userDoc?.firstName?.[0]?.toUpperCase() || 'S',
        votes: voteMap.get(cIdStr) || 0,
        hasVoted: student.votedFor?.toString() === cIdStr
      };
    });

    res.json(candidates);
  });

  static toggleVote = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { candidateId } = req.body;
    
    if (!userId || !candidateId) {
      return res.status(400).json({ message: 'Missing user or candidate ID' });
    }

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // If currently voted for this candidate, remove the vote
    if (student.votedFor?.toString() === candidateId) {
      student.votedFor = null;
      await student.save();
      return res.json({ message: 'Vote removed', votedFor: null });
    }

    // Otherwise, vote for this candidate (overwriting any previous vote)
    student.votedFor = candidateId;
    await student.save();
    res.json({ message: 'Vote cast successfully', votedFor: candidateId });
  });
}
