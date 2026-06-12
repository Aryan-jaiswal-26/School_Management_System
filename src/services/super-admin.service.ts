import axiosInstance from '../lib/axios';

export const SuperAdminAPI = {
  // 1. Auth
  login: async (data: any) => {
    const res = await axiosInstance.post('/super-admin/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await axiosInstance.get('/super-admin/me');
    return res.data;
  },

  // 2. Analytics
  getDashboardMetrics: async () => {
    const res = await axiosInstance.get('/super-admin/dashboard');
    return res.data;
  },
  getDetailedAnalytics: async (params: any) => {
    const res = await axiosInstance.get('/super-admin/analytics', { params });
    return res.data;
  },
  exportAnalytics: async (params: { search?: string; status?: string; plan?: string; format: string }) => {
    const res = await axiosInstance.get('/super-admin/analytics/export', {
      params,
      responseType: 'blob'
    });
    return res.data;
  },

  // 3. Schools
  getSchools: async (params: { page: number; limit: number; search?: string }) => {
    const res = await axiosInstance.get('/super-admin/schools', { params });
    return res.data;
  },
  updateSchoolStatus: async (id: string, status: string) => {
    const res = await axiosInstance.patch(`/super-admin/schools/${id}/status`, { status });
    return res.data;
  },
  updateSchoolFeatures: async (id: string, featureOverrides: Record<string, boolean>) => {
    const res = await axiosInstance.patch(`/super-admin/schools/${id}/features`, { featureOverrides });
    return res.data;
  },
  createSchool: async (data: { name: string; code: string; contactEmail?: string; contactPhone?: string }) => {
    const res = await axiosInstance.post('/schools', data);
    return res.data;
  },
  deleteSchool: async (id: string) => {
    const res = await axiosInstance.delete(`/schools/${id}`);
    return res.data;
  },

  // 4. Plans
  getPlans: async () => {
    const res = await axiosInstance.get('/super-admin/plans');
    return res.data;
  },
  createPlan: async (data: any) => {
    const res = await axiosInstance.post('/super-admin/plans', data);
    return res.data;
  },
  updatePlan: async (id: string, data: any) => {
    const res = await axiosInstance.put(`/super-admin/plans/${id}`, data);
    return res.data;
  },
  deletePlan: async (id: string) => {
    const res = await axiosInstance.delete(`/super-admin/plans/${id}`);
    return res.data;
  },

  // 5. Billing
  getInvoices: async (params: { page: number; limit: number; status?: string }) => {
    const res = await axiosInstance.get('/super-admin/invoices', { params });
    return res.data;
  },

  // 6. Announcements / Notifications
  getAnnouncements: async (params: { page: number; limit: number }) => {
    const res = await axiosInstance.get('/notifications/announcements', { params });
    return res.data;
  },
  broadcastAnnouncement: async (data: any) => {
    const res = await axiosInstance.post('/super-admin/announcements/broadcast', data);
    return res.data;
  },
  pushNotification: async (data: any) => {
    const res = await axiosInstance.post('/super-admin/notifications/push', data);
    return res.data;
  },

  // 7. Support Tickets
  getTickets: async (params: { page: number; limit: number; status?: string }) => {
    const res = await axiosInstance.get('/super-admin/tickets', { params });
    return res.data;
  },
  updateTicketStatus: async (id: string, status: string) => {
    const res = await axiosInstance.patch(`/super-admin/tickets/${id}/status`, { status });
    return res.data;
  },

  // 8. CMS
  getCMSPages: async (type: string) => {
    const res = await axiosInstance.get('/super-admin/cms', { params: { type } });
    return res.data;
  },
  createFAQ: async (data: any) => {
    const res = await axiosInstance.post('/super-admin/cms/faqs', data);
    return res.data;
  },
  updateFAQ: async (id: string, data: any) => {
    const res = await axiosInstance.put(`/super-admin/cms/faqs/${id}`, data);
    return res.data;
  },
  deleteFAQ: async (id: string) => {
    const res = await axiosInstance.delete(`/super-admin/cms/faqs/${id}`);
    return res.data;
  },
  upsertTerms: async (data: any) => {
    const res = await axiosInstance.put('/super-admin/cms/terms', data);
    return res.data;
  },
  upsertPrivacy: async (data: any) => {
    const res = await axiosInstance.put('/super-admin/cms/privacy', data);
    return res.data;
  },
  getFAQs: async () => {
    const res = await axiosInstance.get('/super-admin/cms', { params: { type: 'FAQ' } });
    return res.data;
  },
  getCMSContent: async () => {
    const [termsRes, privacyRes] = await Promise.all([
      axiosInstance.get('/super-admin/cms', { params: { type: 'TERMS' } }),
      axiosInstance.get('/super-admin/cms', { params: { type: 'PRIVACY' } })
    ]);
    return {
      data: {
        termsAndConditions: termsRes.data?.data?.content || "",
        privacyPolicy: privacyRes.data?.data?.content || ""
      }
    };
  },
  updateCMSContent: async (type: string, content: string) => {
    const version = `1.0.${Math.floor(Date.now() / 1000)}`;
    if (type === 'terms') {
      const res = await axiosInstance.put('/super-admin/cms/terms', {
        version,
        content,
        isActive: true
      });
      return res.data;
    } else {
      const res = await axiosInstance.put('/super-admin/cms/privacy', {
        version,
        content,
        isActive: true
      });
      return res.data;
    }
  },

  // 9. Settings
  getSettings: async () => {
    const res = await axiosInstance.get('/super-admin/settings');
    return res.data;
  },
  updateSettings: async (data: any) => {
    const res = await axiosInstance.put('/super-admin/settings', data);
    return res.data;
  },
};
