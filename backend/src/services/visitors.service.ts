import { VisitorLog, PreApprovedVisitor, BlacklistedVisitor } from '../models/Visitor.js';
import { ApiError } from '../utils/api-error.js';
import { resolveSchoolId } from '../utils/school.js';

export class VisitorsService {
  async getLogs(context: any) {
    const schoolId = await resolveSchoolId(context);
    return VisitorLog.find({ schoolId }).sort({ timeIn: -1 });
  }

  async getPreApproved(context: any) {
    const schoolId = await resolveSchoolId(context);
    return PreApprovedVisitor.find({ schoolId }).sort({ validUntil: 1 });
  }

  async getBlacklist(context: any) {
    const schoolId = await resolveSchoolId(context);
    return BlacklistedVisitor.find({ schoolId }).sort({ dateAdded: -1 });
  }

  async createLog(context: any, input: any) {
    const schoolId = await resolveSchoolId(context);
    const log = new VisitorLog({ ...input, schoolId });
    await log.save();
    return log;
  }

  async checkoutVisitor(context: any, logId: string) {
    const schoolId = await resolveSchoolId(context);
    const log = await VisitorLog.findOne({ _id: logId, schoolId });
    if (!log) throw new ApiError(404, 'Visitor log not found');
    
    log.timeOut = new Date();
    log.status = 'Checked Out';
    await log.save();
    return log;
  }
}
