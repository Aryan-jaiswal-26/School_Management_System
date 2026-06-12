import { AdmissionApplication } from '../models/Admission.js';
import { ApiError } from '../utils/api-error.js';
import { resolveSchoolId } from '../utils/school.js';

export class AdmissionsService {
  async getApplications(context: any) {
    const schoolId = await resolveSchoolId(context);
    return AdmissionApplication.find({ schoolId }).sort({ appliedAt: -1 });
  }

  async getWaitlist(context: any) {
    const schoolId = await resolveSchoolId(context);
    return AdmissionApplication.find({ schoolId, applicationStatus: 'Waitlisted' }).sort({ appliedAt: 1 }); // Oldest first
  }

  async getMyApplications(context: any) {
    const schoolId = await resolveSchoolId(context);
    return AdmissionApplication.find({ schoolId, userId: context._id }).sort({ appliedAt: -1 });
  }

  async createApplication(context: any, input: any) {
    const schoolId = await resolveSchoolId(context);
    const application = new AdmissionApplication({ ...input, schoolId, userId: context._id });
    await application.save();
    return application;
  }

  async updateApplicationStatus(context: any, id: string, status: string) {
    const schoolId = await resolveSchoolId(context);
    const application = await AdmissionApplication.findOne({ _id: id, schoolId });
    if (!application) throw new ApiError(404, 'Application not found');

    application.applicationStatus = status;
    application.reviewedAt = new Date();
    application.reviewedBy = context.email || context._id;
    await application.save();
    return application;
  }
}
