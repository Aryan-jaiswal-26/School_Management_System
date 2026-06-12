import { Request, Response } from 'express';
import { OnboardingChecklist } from '../models/OnboardingChecklist.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

const DEFAULT_ONBOARDING_STEPS = [
  'Documents Verified',
  'Fee Paid',
  'ID Card Issued',
  'Uniform Collected',
  'Hostel/Transport Assigned'
];

export async function getStudentOnboarding(req: Request, res: Response) {
  const { studentId } = req.params;
  const schoolId = req.user?.schoolId || req.query.schoolId;

  let checklist = await OnboardingChecklist.findOne({ 
    schoolId: new Types.ObjectId(schoolId as string), 
    studentId: new Types.ObjectId(studentId as string) 
  });

  if (!checklist) {
    // Auto-create with default steps
    checklist = await OnboardingChecklist.create({
      schoolId,
      studentId,
      status: 'NOT_STARTED',
      steps: DEFAULT_ONBOARDING_STEPS.map(title => ({ title, isCompleted: false }))
    } as any);
  }

  return sendResponse(res, 200, 'Onboarding checklist retrieved', checklist);
}

export async function updateOnboardingStep(req: Request, res: Response) {
  const { studentId } = req.params;
  const { stepId, isCompleted, notes } = req.body;
  const schoolId = req.user?.schoolId || req.body.schoolId;

  const checklist = await OnboardingChecklist.findOne({ 
    schoolId: new Types.ObjectId(schoolId as string), 
    studentId: new Types.ObjectId(studentId as string) 
  });
  if (!checklist) {
    return sendResponse(res, 404, 'Checklist not found for student', null);
  }

  const step = (checklist.steps as any).id(stepId);
  if (!step) {
    return sendResponse(res, 404, 'Step not found', null);
  }

  step.isCompleted = isCompleted;
  step.notes = notes;
  if (isCompleted) {
    step.completedAt = new Date();
    step.completedBy = req.user?.email || (req.user as any)?.id || (req.user as any)?._id;
  }

  // Update overall status
  const allCompleted = checklist.steps.every(s => s.isCompleted);
  const someCompleted = checklist.steps.some(s => s.isCompleted);
  
  if (allCompleted) {
    checklist.status = 'COMPLETED';
    checklist.completedAt = new Date();
  } else if (someCompleted) {
    checklist.status = 'IN_PROGRESS';
    checklist.completedAt = undefined;
  } else {
    checklist.status = 'NOT_STARTED';
    checklist.completedAt = undefined;
  }

  await checklist.save();

  return sendResponse(res, 200, 'Onboarding step updated', checklist);
}
