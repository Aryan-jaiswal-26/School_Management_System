import { Request, Response, NextFunction } from 'express';
import { ParentService } from '../services/parent.service.js';
import { sendResponse } from '../utils/response.js';

export class ParentController {
  // GET /parents/dashboard
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const data = await ParentService.getDashboardData(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const data = await ParentService.getProfile(userId);
      sendResponse(res, 200, 'Parent profile retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async getChildContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildContacts(userId!, studentId);
      sendResponse(res, 200, 'Child contacts retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async submitChildLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.submitChildLeave(userId!, studentId, req.body);
      sendResponse(res, 201, 'Leave application submitted', data);
    } catch (error) {
      next(error);
    }
  }

  static async listChildLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const studentId = req.query['studentId'] as string | undefined;
      const data = await ParentService.listChildLeaves(userId!, studentId);
      sendResponse(res, 200, 'Child leave requests retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async getChildCanteen(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      // studentId is a route param: GET /parents/children/:studentId/canteen
      const studentId = req.params['studentId'] as string | undefined;
      const data = await ParentService.getChildCanteen(userId!, studentId);
      sendResponse(res, 200, 'Child canteen details retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.getChildNotificationPreferences(userId!);
      sendResponse(res, 200, 'Notification preferences retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.updateChildNotificationPreferences(userId!, req.body);
      sendResponse(res, 200, 'Notification preferences updated', data);
    } catch (error) {
      next(error);
    }
  }

  static async listCommunityPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.listCommunityPosts(userId!);
      sendResponse(res, 200, 'Community posts retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async createCommunityPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.createCommunityPost(userId!, req.body);
      sendResponse(res, 201, 'Community post created', data);
    } catch (error) {
      next(error);
    }
  }

  static async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.submitFeedback(userId!, req.body);
      sendResponse(res, 201, 'Feedback submitted', data);
    } catch (error) {
      next(error);
    }
  }

  static async listFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const data = await ParentService.listFeedback(userId!);
      sendResponse(res, 200, 'Feedback retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/academics
  static async getChildAcademics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildAcademics(userId, studentId);
      sendResponse(res, 200, 'Child academics retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/homework
  static async getChildHomework(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildHomework(userId, studentId);
      sendResponse(res, 200, 'Child homework retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/report-cards
  static async getChildReportCards(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildReportCards(userId, studentId);
      sendResponse(res, 200, 'Child report cards retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/attendance
  static async getChildAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildAttendance(userId, studentId);
      sendResponse(res, 200, 'Child attendance retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/transport
  static async getChildTransport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getChildTransport(userId, studentId);
      if (!data) return sendResponse(res, 404, 'No transport route found for this student', null);
      sendResponse(res, 200, 'Child transport retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/children/:studentId/ptm
  static async getPtmMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.getPtmMeetings(userId, studentId);
      sendResponse(res, 200, 'PTM meetings retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // POST /parents/children/:studentId/ptm
  static async createPtmMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.params['studentId'] as string;
      const data = await ParentService.createPtmMeeting(userId, studentId, req.body);
      sendResponse(res, 201, 'PTM meeting requested', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/fees?studentId=<id>
  static async getFees(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.query['studentId'] as string | undefined;
      const data = await ParentService.getChildFees(userId, studentId);
      sendResponse(res, 200, 'Fees retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  // GET /parents/payments?studentId=<id>
  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const studentId = req.query['studentId'] as string | undefined;
      const data = await ParentService.getChildPayments(userId, studentId);
      sendResponse(res, 200, 'Payments retrieved', data);
    } catch (error) {
      next(error);
    }
  }
}
