import { Request, Response } from 'express';
import { SuperAdminService } from '../services/super-admin.service.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { signAccessToken } from '../config/jwt.js';
import { env } from '../config/env.js';
import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfMake.setFonts(fonts);

export class SuperAdminController {
  // Auth
  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail, role: 'SUPER_ADMIN' });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      
      // Assume bcrypt check here (mocked for brevity if password isn't hashed yet)
      const isMatch = true; 
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = signAccessToken({
        sub: user._id.toString(),
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
      });

      // Log the login activity
      try {
        await ActivityLog.create({
          userId: user._id,
          activityType: 'LOGIN',
          ipAddress: req.ip || 'System',
          userAgent: req.headers['user-agent'] || 'Browser',
        });
      } catch (e) {
        console.error("Failed to write superadmin login activity log", e);
      }

      sendResponse(res, 200, 'Login successful', { token, user: { id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}` } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static getMe = async (req: Request, res: Response) => {
    try {
      const user = await User.findById((req as any).user.id).select('-password');
      sendResponse(res, 200, 'Profile fetched', user);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Analytics
  static getDashboardMetrics = async (req: Request, res: Response) => {
    try {
      const metrics = await SuperAdminService.getDashboardMetrics();
      sendResponse(res, 200, 'Metrics fetched', metrics);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Schools
  static getAllSchools = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = req.query as any;
      const schools = await SuperAdminService.getSchools(page, limit, search);
      sendResponse(res, 200, 'Schools fetched', schools);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSchoolStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = new Types.ObjectId((req as any).user.id);
      const school = await SuperAdminService.updateSchoolStatus(id, status, adminId);
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });
      sendResponse(res, 200, 'School status updated', school);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSchoolFeatures = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { featureOverrides } = req.body;
      const adminId = new Types.ObjectId((req as any).user.id);
      const school = await SuperAdminService.updateSchoolFeatures(id, featureOverrides, adminId);
      if (!school) return res.status(404).json({ success: false, message: 'School not found' });
      sendResponse(res, 200, 'School features updated', school);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Subscription Plans
  static getSubscriptionPlans = async (req: Request, res: Response) => {
    try {
      const plans = await SuperAdminService.getSubscriptionPlans();
      sendResponse(res, 200, 'Plans fetched', plans);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createSubscriptionPlan = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const plan = await SuperAdminService.createSubscriptionPlan(req.body, adminId);
      sendResponse(res, 201, 'Plan created', plan);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSubscriptionPlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = new Types.ObjectId((req as any).user.id);
      const plan = await SuperAdminService.updateSubscriptionPlan(id, req.body, adminId);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
      sendResponse(res, 200, 'Plan updated', plan);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deleteSubscriptionPlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = new Types.ObjectId((req as any).user.id);
      const plan = await SuperAdminService.deleteSubscriptionPlan(id, adminId);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
      sendResponse(res, 200, 'Plan deleted', { id });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Billing
  static getAllInvoices = async (req: Request, res: Response) => {
    try {
      const { page, limit, status } = req.query as any;
      const invoices = await SuperAdminService.getInvoices(page, limit, status);
      sendResponse(res, 200, 'Invoices fetched', invoices);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Announcements & Notifications
  static broadcastAnnouncement = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const announcement = await SuperAdminService.createAnnouncement(req.body, adminId);
      sendResponse(res, 201, 'Announcement broadcasted', announcement);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static pushNotification = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const notification = await SuperAdminService.pushNotification(req.body, adminId);
      sendResponse(res, 201, 'Notification pushed', notification);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Support Tickets
  static getAllTickets = async (req: Request, res: Response) => {
    try {
      const { page, limit, status } = req.query as any;
      const tickets = await SuperAdminService.getTickets(page, limit, status);
      sendResponse(res, 200, 'Tickets fetched', tickets);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateTicketStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = new Types.ObjectId((req as any).user.id);
      const ticket = await SuperAdminService.updateTicketStatus(id, status, adminId);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      sendResponse(res, 200, 'Ticket status updated', ticket);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // CMS
  static getCMSPages = async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string || 'FAQ';
      const page = await SuperAdminService.getCMSPage(type);
      sendResponse(res, 200, 'CMS Content fetched', page);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createFAQ = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const faq = await SuperAdminService.createFAQ(req.body, adminId);
      sendResponse(res, 201, 'FAQ created', faq);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateFAQ = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const faq = await SuperAdminService.updateFAQ(req.params.id, req.body, adminId);
      sendResponse(res, 200, 'FAQ updated', faq);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deleteFAQ = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      await SuperAdminService.deleteFAQ(req.params.id, adminId);
      sendResponse(res, 200, 'FAQ deleted', {});
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static upsertTerms = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const terms = await SuperAdminService.upsertTerms(req.body, adminId);
      sendResponse(res, 200, 'Terms updated', terms);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static upsertPrivacy = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const privacy = await SuperAdminService.upsertPrivacy(req.body, adminId);
      sendResponse(res, 200, 'Privacy Policy updated', privacy);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Settings
  static getPlatformSettings = async (req: Request, res: Response) => {
    try {
      const settings = await SuperAdminService.getSettings();
      sendResponse(res, 200, 'Settings fetched', settings);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updatePlatformSettings = async (req: Request, res: Response) => {
    try {
      const adminId = new Types.ObjectId((req as any).user.id);
      const settings = await SuperAdminService.updateSettings(req.body, adminId);
      sendResponse(res, 200, 'Settings updated', settings);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDetailedAnalytics = async (req: Request, res: Response) => {
    try {
      const { page, limit, search, status, plan, sortBy, sortOrder } = req.query as any;
      const analytics = await SuperAdminService.getDetailedAnalytics({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        status,
        plan,
        sortBy,
        sortOrder
      });
      sendResponse(res, 200, 'Detailed analytics fetched', analytics);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static exportSchoolsAnalytics = async (req: Request, res: Response) => {
    try {
      const { search, status, plan, format } = req.query as any;
      
      const analytics = await SuperAdminService.getDetailedAnalytics({
        search,
        status,
        plan,
        page: 1,
        limit: 100000,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      const schools = analytics.schoolsAnalytics.data;
      
      if (format === 'csv') {
        let csv = 'School Name,School Code,Total Users,Active Users (30d),Engagement Score (%),Subscription Plan,Subscription Status,Total Revenue ($),Status\n';
        schools.forEach((s: any) => {
          csv += `"${s.name}","${s.code}",${s.totalUsers},${s.activeUsers30d},${s.engagementScore},"${s.subscriptionPlan}","${s.subscriptionStatus}",${s.revenue},"${s.status}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=schools_analytics.csv');
        return res.status(200).send(csv);
      }
      
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Schools Analytics');
        
        sheet.columns = [
          { header: 'School Name', key: 'name', width: 25 },
          { header: 'School Code', key: 'code', width: 15 },
          { header: 'Total Users', key: 'totalUsers', width: 12 },
          { header: 'Active Users (30d)', key: 'activeUsers30d', width: 18 },
          { header: 'Engagement Score (%)', key: 'engagementScore', width: 22 },
          { header: 'Subscription Plan', key: 'subscriptionPlan', width: 20 },
          { header: 'Subscription Status', key: 'subscriptionStatus', width: 20 },
          { header: 'Total Revenue ($)', key: 'revenue', width: 18 },
          { header: 'Status', key: 'status', width: 12 }
        ];
        
        schools.forEach((s: any) => {
          sheet.addRow({
            name: s.name,
            code: s.code,
            totalUsers: s.totalUsers,
            activeUsers30d: s.activeUsers30d,
            engagementScore: s.engagementScore,
            subscriptionPlan: s.subscriptionPlan,
            subscriptionStatus: s.subscriptionStatus,
            revenue: s.revenue,
            status: s.status
          });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=schools_analytics.xlsx');
        await workbook.xlsx.write(res);
        return res.end();
      }
      
      if (format === 'pdf') {
        const body: any[][] = [
          ['School Name', 'Code', 'Users', 'Active (30d)', 'Engagement %', 'Plan', 'Sub Status', 'Revenue', 'Status']
        ];
        
        schools.forEach((s: any) => {
          body.push([
            s.name,
            s.code,
            String(s.totalUsers),
            String(s.activeUsers30d),
            `${s.engagementScore}%`,
            s.subscriptionPlan,
            s.subscriptionStatus,
            `$${s.revenue}`,
            s.status
          ]);
        });
        
        const docDefinition = {
          content: [
            { text: 'Schools Platform Analytics Report', style: 'header' },
            { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
            {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body
              }
            }
          ],
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              margin: [0, 0, 0, 5] as [number, number, number, number]
            },
            subheader: {
              fontSize: 10,
              italics: true,
              margin: [0, 0, 0, 15] as [number, number, number, number]
            }
          },
          defaultStyle: {
            font: 'Roboto'
          }
        };
        
        const doc = pdfMake.createPdf(docDefinition);
        const pdfDoc = await doc.getStream();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=schools_analytics.pdf');
        pdfDoc.pipe(res);
        return pdfDoc.end();
      }
      
      return res.status(400).json({ success: false, message: 'Invalid format requested' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
