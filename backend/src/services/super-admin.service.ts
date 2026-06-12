import { School } from '../models/School.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { FAQ } from '../models/FAQ.js';
import { TermsCondition } from '../models/TermsCondition.js';
import { PrivacyPolicy } from '../models/PrivacyPolicy.js';
import { FeatureToggle } from '../models/FeatureToggle.js';
import { AppSetting } from '../models/AppSetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Types } from 'mongoose';

export class SuperAdminService {
  
  // 1. Analytics
  static async getDashboardMetrics() {
    const totalSchools = await School.countDocuments({ isDeleted: { $ne: true } });
    const activeSchools = await School.countDocuments({ status: 'ACTIVE', isDeleted: { $ne: true } });
    const suspendedSchools = await School.countDocuments({ status: 'SUSPENDED', isDeleted: { $ne: true } });
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    
    const activeSubscriptions = await Subscription.find({ status: 'ACTIVE' }).populate('planId');
    let mrr = 0;
    activeSubscriptions.forEach((sub: any) => {
      if (sub.planId && sub.planId.price) {
        if (sub.planId.billingCycle === 'MONTHLY') mrr += sub.planId.price;
        if (sub.planId.billingCycle === 'YEARLY') mrr += sub.planId.price / 12;
      }
    });

    // Generate last 6 months template
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        revenue: 0,
        schools: 0
      });
    }

    // School growth trend
    const schools = await School.find({ isDeleted: { $ne: true } });
    schools.forEach(school => {
      const created = new Date(school.createdAt);
      const match = months.find(m => m.year === created.getFullYear() && m.monthNum === created.getMonth());
      if (match) {
        match.schools++;
      }
    });

    // Accumulate schools for growth chart
    let cumulativeSchools = await School.countDocuments({ 
      isDeleted: { $ne: true }, 
      createdAt: { $lt: new Date(months[0].year, months[0].monthNum, 1) } 
    });
    months.forEach(m => {
      cumulativeSchools += m.schools;
      m.schools = cumulativeSchools;
    });

    // Revenue trend from PAID invoices
    const invoices = await Invoice.find({ status: 'PAID' });
    invoices.forEach(inv => {
      const paidAt = new Date(inv.paidAt || inv.updatedAt || inv.createdAt);
      const match = months.find(m => m.year === paidAt.getFullYear() && m.monthNum === paidAt.getMonth());
      if (match) {
        match.revenue += inv.amount || 0;
      }
    });

    // Map trends
    const revenueData = months.map(m => ({ name: m.name, revenue: m.revenue }));
    const growthData = months.map(m => ({ name: m.name, schools: m.schools }));

    // Recent activities from AuditLog
    const auditLogs = await AuditLog.find()
      .populate('userId', 'firstName lastName email')
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivities = auditLogs.map(log => {
      let schoolName = 'System-wide';
      if (log.schoolId && (log.schoolId as any).name) {
        schoolName = (log.schoolId as any).name;
      } else if (log.changes?.after?.schoolName) {
        schoolName = log.changes.after.schoolName;
      } else if (log.changes?.after?.name) {
        schoolName = log.changes.after.name;
      }

      let actionStr = log.action.replace(/_/g, ' ');
      actionStr = actionStr.charAt(0).toUpperCase() + actionStr.slice(1).toLowerCase();

      return {
        id: log._id.toString(),
        action: actionStr,
        school: schoolName,
        time: log.createdAt
      };
    });

    return {
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      monthlyRevenue: Math.round(mrr),
      mrr: Math.round(mrr),
      revenueData,
      growthData,
      recentActivities
    };
  }

  static async getDetailedAnalytics(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const search = params.search || '';
    const statusFilter = params.status || '';
    const planFilter = params.plan || '';
    const sortBy = params.sortBy || 'name';
    const sortOrder = params.sortOrder || 'asc';

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. KPI calculations
    // Total Active Schools
    const totalActiveSchools = await School.countDocuments({ status: 'ACTIVE', isDeleted: { $ne: true } });

    // DAU & MAU
    const activeDauList = await ActivityLog.distinct('userId', { createdAt: { $gte: oneDayAgo } });
    const dau = activeDauList.length;

    const activeMauList = await ActivityLog.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } });
    const mau = activeMauList.length;

    // User growth
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const usersThisMonth = await User.countDocuments({ createdAt: { $gte: startThisMonth }, isDeleted: { $ne: true } });
    const usersPrevMonth = await User.countDocuments({ createdAt: { $gte: startPrevMonth, $lt: startThisMonth }, isDeleted: { $ne: true } });
    const userGrowth = usersPrevMonth > 0 ? Number(((usersThisMonth - usersPrevMonth) / usersPrevMonth * 100).toFixed(1)) : (usersThisMonth * 100);

    // 2. Trend charts calculations
    // DAU Trend (Last 30 days)
    const dauTrend: Array<{ date: string; users: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const dayDau = await ActivityLog.distinct('userId', { createdAt: { $gte: startOfDay, $lte: endOfDay } });
      dauTrend.push({
        date: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        users: dayDau.length
      });
    }

    // Generate last 6 months template
    const months: Array<{ name: string; year: number; monthNum: number; startDate: Date; endDate: Date }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        startDate: start,
        endDate: end
      });
    }

    // MAU Trend (Last 6 months)
    const mauTrend = await Promise.all(
      months.map(async (m) => {
        const monthUsers = await ActivityLog.distinct('userId', { createdAt: { $gte: m.startDate, $lte: m.endDate } });
        return {
          month: `${m.name} ${m.year}`,
          users: monthUsers.length
        };
      })
    );

    // Churn Rate Trend (Last 6 months)
    const churnRateTrend = await Promise.all(
      months.map(async (m) => {
        const canceled = await Subscription.countDocuments({ status: 'CANCELED', updatedAt: { $gte: m.startDate, $lte: m.endDate } });
        const active = await Subscription.countDocuments({ status: 'ACTIVE', isDeleted: { $ne: true } });
        const rate = (active + canceled) > 0 ? Number(((canceled / (active + canceled)) * 100).toFixed(1)) : 0;
        return {
          month: `${m.name} ${m.year}`,
          rate
        };
      })
    );

    // Revenue Trend (Last 6 months)
    const revenueTrend = await Promise.all(
      months.map(async (m) => {
        const invoices = await Invoice.find({ status: 'PAID', paidAt: { $gte: m.startDate, $lte: m.endDate } });
        const revenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
        return {
          month: `${m.name} ${m.year}`,
          revenue: Math.round(revenue)
        };
      })
    );

    // 3. User Role Distribution
    const userRoleCounts = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const totalUsersCount = userRoleCounts.reduce((acc, r) => acc + r.count, 0);
    const userRoleDistribution = userRoleCounts.map((r) => ({
      role: r._id,
      count: r.count,
      percentage: totalUsersCount > 0 ? Number(((r.count / totalUsersCount) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.count - a.count);

    // 4. School-wise analytics computation (for all schools to support dynamic sort/filter)
    const allSchools = await School.find({ isDeleted: { $ne: true } });
    const processedSchools = await Promise.all(
      allSchools.map(async (school) => {
        const totalUsers = await User.countDocuments({ schoolId: school._id, isDeleted: { $ne: true } });
        const activeUsers30dList = await ActivityLog.distinct('userId', { schoolId: school._id, createdAt: { $gte: thirtyDaysAgo } });
        const activeUsers30d = activeUsers30dList.length;
        const engagementScore = totalUsers > 0 ? Math.min(100, Math.round((activeUsers30d / totalUsers) * 100)) : 0;

        const sub = await Subscription.findOne({ schoolId: school._id }).populate('planId');
        const planName = sub && (sub as any).planId ? (sub as any).planId.name : 'No Plan';
        const planCode = sub && (sub as any).planId ? (sub as any).planId.code : 'NONE';
        const subStatus = sub ? sub.status : 'NO_SUBSCRIPTION';

        const invoices = await Invoice.find({ schoolId: school._id, status: 'PAID' });
        const revenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

        return {
          schoolId: school._id.toString(),
          name: school.name,
          code: school.code,
          totalUsers,
          activeUsers30d,
          engagementScore,
          subscriptionStatus: subStatus,
          subscriptionPlan: planName,
          planCode,
          revenue: Math.round(revenue),
          status: school.status,
          createdAt: school.createdAt
        };
      })
    );

    // Filter processed schools
    let filteredSchools = processedSchools.filter((s) => {
      // Search filter
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
      // Status filter
      const matchesStatus = !statusFilter || s.status === statusFilter;
      // Plan filter
      const matchesPlan = !planFilter || s.planCode === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });

    // Compute average engagement score and current month churn rate
    const totalEng = filteredSchools.reduce((acc, s) => acc + s.engagementScore, 0);
    const avgEngagementScore = filteredSchools.length > 0 ? Math.round(totalEng / filteredSchools.length) : 0;

    const currentMonthCanceled = await Subscription.countDocuments({ status: 'CANCELED', updatedAt: { $gte: startThisMonth } });
    const currentMonthActive = await Subscription.countDocuments({ status: 'ACTIVE', isDeleted: { $ne: true } });
    const avgChurnRate = (currentMonthActive + currentMonthCanceled) > 0 ? Number(((currentMonthCanceled / (currentMonthActive + currentMonthCanceled)) * 100).toFixed(1)) : 0;

    // Sort schools
    filteredSchools.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Top Performing & Low Performing Schools lists (based on sorted filtered list)
    const schoolsSortedByEngagement = [...processedSchools].sort((a, b) => b.engagementScore - a.engagementScore);
    const topPerformingSchools = schoolsSortedByEngagement.slice(0, 5).map((s) => ({
      schoolName: s.name,
      schoolCode: s.code,
      totalUsers: s.totalUsers,
      activeUsers: s.activeUsers30d,
      engagementScore: s.engagementScore
    }));
    const lowPerformingSchools = [...schoolsSortedByEngagement].reverse().slice(0, 5).map((s) => ({
      schoolName: s.name,
      schoolCode: s.code,
      totalUsers: s.totalUsers,
      activeUsers: s.activeUsers30d,
      engagementScore: s.engagementScore
    }));

    // Paginate table results
    const total = filteredSchools.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedSchools = filteredSchools.slice((page - 1) * limit, page * limit);

    // Total recurring revenue (MRR)
    const activeSubscriptions = await Subscription.find({ status: 'ACTIVE' }).populate('planId');
    let mrr = 0;
    activeSubscriptions.forEach((sub: any) => {
      if (sub.planId && sub.planId.price) {
        if (sub.planId.billingCycle === 'MONTHLY') mrr += sub.planId.price;
        if (sub.planId.billingCycle === 'YEARLY') mrr += sub.planId.price / 12;
      }
    });

    // Sum overall total revenue
    const allPaidInvoices = await Invoice.find({ status: 'PAID' });
    const totalRevenue = allPaidInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

    return {
      kpis: {
        dau,
        mau,
        totalActiveSchools,
        userGrowth,
        avgEngagementScore,
        avgChurnRate
      },
      revenueAnalytics: {
        totalRevenue: Math.round(totalRevenue),
        mrr: Math.round(mrr),
        revenueTrend
      },
      dauTrend,
      mauTrend,
      churnRateTrend,
      userRoleDistribution,
      topPerformingSchools,
      lowPerformingSchools,
      schoolsAnalytics: {
        data: paginatedSchools,
        total,
        page,
        limit,
        totalPages
      }
    };
  }


  // 2. Schools
  static async getSchools(page: number, limit: number, search?: string) {
    const query: any = { isDeleted: { $ne: true } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (page - 1) * limit;
    const [schools, total] = await Promise.all([
      School.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      School.countDocuments(query),
    ]);

    return { data: schools, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateSchoolStatus(schoolId: string, status: string, adminId: Types.ObjectId) {
    const school = await School.findByIdAndUpdate(schoolId, { status, isActive: status === 'ACTIVE' }, { new: true });
    if (school) {
      await this.logAudit(adminId, 'UPDATE_SCHOOL_STATUS', 'School', schoolId, { status });
    }
    return school;
  }

  static async updateSchoolFeatures(schoolId: string, featureOverrides: Record<string, boolean>, adminId: Types.ObjectId) {
    const school = await School.findByIdAndUpdate(schoolId, { featureOverrides }, { new: true });
    if (school) {
      await this.logAudit(adminId, 'UPDATE_SCHOOL_FEATURES', 'School', schoolId, { featureOverrides });
    }
    return school;
  }

  // 3. Subscription Plans
  static async getSubscriptionPlans() {
    return SubscriptionPlan.find().sort({ price: 1 });
  }

  static async createSubscriptionPlan(data: any, adminId: Types.ObjectId) {
    const plan = await SubscriptionPlan.create(data);
    await this.logAudit(adminId, 'CREATE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', plan._id as string, { code: plan.code });
    return plan;
  }

  static async updateSubscriptionPlan(planId: string, data: any, adminId: Types.ObjectId) {
    const plan = await SubscriptionPlan.findByIdAndUpdate(planId, data, { new: true });
    if (plan) {
      await this.logAudit(adminId, 'UPDATE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', planId, { name: plan.name });
    }
    return plan;
  }

  static async deleteSubscriptionPlan(planId: string, adminId: Types.ObjectId) {
    const plan = await SubscriptionPlan.findByIdAndDelete(planId);
    if (plan) {
      await this.logAudit(adminId, 'DELETE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', planId, { name: plan.name });
    }
    return plan;
  }

  // 4. Invoices
  static async getInvoices(page: number, limit: number, status?: string) {
    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).populate('schoolId', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Invoice.countDocuments(query),
    ]);
    
    return { data: invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // 5. Announcements & Notifications
  static async createAnnouncement(data: any, adminId: Types.ObjectId) {
    const announcement = await Announcement.create(data);
    await this.logAudit(adminId, 'CREATE_GLOBAL_ANNOUNCEMENT', 'Announcement', announcement._id as string, { title: data.title });
    return announcement;
  }

  static async pushNotification(data: any, adminId: Types.ObjectId) {
    // In a real app, this would trigger a job queue (e.g. BullMQ) to send push/emails
    // Here we just record it in the DB
    const { targetSchoolId, ...rest } = data;
    
    // If targetSchoolId is provided, just create one Notification record.
    // Otherwise, this is a system-wide broadcast. We'll just create a dummy record to represent the broadcast.
    const notif = await Notification.create({
      schoolId: targetSchoolId || new Types.ObjectId(), // Needs valid ObjectId
      userId: adminId, // Sender
      ...rest,
      status: 'QUEUED'
    });
    
    await this.logAudit(adminId, 'PUSH_NOTIFICATION', 'Notification', notif._id as string, { title: data.title, targetSchoolId });
    return notif;
  }

  // 6. Support Tickets
  static async getTickets(page: number, limit: number, status?: string) {
    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query).populate('userId', 'firstName lastName email').skip(skip).limit(limit).sort({ createdAt: -1 }),
      SupportTicket.countDocuments(query),
    ]);
    
    return { data: tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateTicketStatus(ticketId: string, status: string, adminId: Types.ObjectId) {
    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
    if (ticket) {
      await this.logAudit(adminId, 'UPDATE_TICKET_STATUS', 'SupportTicket', ticketId, { status });
    }
    return ticket;
  }

  // 7. CMS
  static async getCMSPage(type: string) {
    if (type === 'TERMS') return TermsCondition.findOne({ isActive: true }).sort({ version: -1 });
    if (type === 'PRIVACY') return PrivacyPolicy.findOne({ isActive: true }).sort({ version: -1 });
    if (type === 'FAQ') return FAQ.find({ isActive: true }).sort({ order: 1 });
    return null;
  }

  static async createFAQ(data: any, adminId: Types.ObjectId) {
    const faq = await FAQ.create(data);
    await this.logAudit(adminId, 'CREATE_FAQ', 'FAQ', faq._id as string, { question: data.question });
    return faq;
  }

  static async updateFAQ(id: string, data: any, adminId: Types.ObjectId) {
    const faq = await FAQ.findByIdAndUpdate(id, data, { new: true });
    if (faq) await this.logAudit(adminId, 'UPDATE_FAQ', 'FAQ', id, { question: faq.question });
    return faq;
  }

  static async deleteFAQ(id: string, adminId: Types.ObjectId) {
    const faq = await FAQ.findByIdAndDelete(id);
    if (faq) await this.logAudit(adminId, 'DELETE_FAQ', 'FAQ', id, {});
    return faq;
  }

  static async upsertTerms(data: any, adminId: Types.ObjectId) {
    // If setting a new active version, deactivate old ones
    if (data.isActive) await TermsCondition.updateMany({}, { isActive: false });
    const terms = await TermsCondition.create({ ...data, publishedAt: new Date() });
    await this.logAudit(adminId, 'UPSERT_TERMS', 'TermsCondition', terms._id as string, { version: data.version });
    return terms;
  }

  static async upsertPrivacy(data: any, adminId: Types.ObjectId) {
    if (data.isActive) await PrivacyPolicy.updateMany({}, { isActive: false });
    const privacy = await PrivacyPolicy.create({ ...data, publishedAt: new Date() });
    await this.logAudit(adminId, 'UPSERT_PRIVACY', 'PrivacyPolicy', privacy._id as string, { version: data.version });
    return privacy;
  }

  // 8. Settings
  static async getSettings() {
    let settings = await AppSetting.findOne();
    if (!settings) {
      settings = await AppSetting.create({});
    }
    return settings;
  }

  static async updateSettings(data: any, adminId: Types.ObjectId) {
    let settings = await AppSetting.findOne();
    if (!settings) {
      settings = await AppSetting.create(data);
    } else {
      settings = await AppSetting.findByIdAndUpdate(settings._id, data, { new: true });
    }
    if (settings) {
       await this.logAudit(adminId, 'UPDATE_GLOBAL_SETTINGS', 'AppSetting', settings._id as string, {});
    }
    return settings;
  }

  // Helper: Audit Logging
  static async logAudit(userId: Types.ObjectId, action: string, resourceType: string, resourceId: string, details: any) {
    await AuditLog.create({
      userId,
      action: action.toUpperCase(),
      module: resourceType.toUpperCase(),
      resourceId,
      changes: { after: details },
      ipAddress: 'System', // In real prod, pass from req.ip
    });
  }
}
