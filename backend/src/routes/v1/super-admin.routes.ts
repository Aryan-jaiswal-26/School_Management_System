import { Router } from 'express';
import { SuperAdminController } from '../../controllers/super-admin.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import * as v from '../../validations/super-admin.validation.js';

export const superAdminRouter = Router();

/**
 * @openapi
 * /super-admin/login:
 *   post:
 *     tags:
 *       - Super Admin Auth
 *     summary: Super Admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.post('/login', validateRequest(v.loginSchema), SuperAdminController.login);

// Protected routes
superAdminRouter.use(authenticateToken);
superAdminRouter.use(requireRoles('SUPER_ADMIN'));

/**
 * @openapi
 * /super-admin/me:
 *   get:
 *     tags:
 *       - Super Admin Auth
 *     summary: Get current super admin profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.get('/me', SuperAdminController.getMe);

/**
 * @openapi
 * /super-admin/dashboard:
 *   get:
 *     tags:
 *       - Super Admin Analytics
 *     summary: Get global dashboard KPIs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.get('/dashboard', SuperAdminController.getDashboardMetrics);
superAdminRouter.get('/analytics', SuperAdminController.getDetailedAnalytics);
superAdminRouter.get('/analytics/export', SuperAdminController.exportSchoolsAnalytics);

/**
 * @openapi
 * /super-admin/schools:
 *   get:
 *     tags:
 *       - Super Admin Schools
 *     summary: Get paginated list of schools
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.get('/schools', validateRequest(v.paginationQuerySchema), SuperAdminController.getAllSchools);

/**
 * @openapi
 * /super-admin/schools/{id}/status:
 *   patch:
 *     tags:
 *       - Super Admin Schools
 *     summary: Update school status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PENDING, REJECTED, SUSPENDED]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.patch('/schools/:id/status', validateRequest(v.updateSchoolStatusSchema), SuperAdminController.updateSchoolStatus);

/**
 * @openapi
 * /super-admin/plans:
 *   get:
 *     tags:
 *       - Super Admin Plans
 *     summary: Get all subscription plans
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.get('/plans', SuperAdminController.getSubscriptionPlans);

/**
 * @openapi
 * /super-admin/plans:
 *   post:
 *     tags:
 *       - Super Admin Plans
 *     summary: Create a new subscription plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               price:
 *                 type: number
 *               billingCycle:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               limits:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 */
superAdminRouter.post('/plans', validateRequest(v.createSubscriptionPlanSchema), SuperAdminController.createSubscriptionPlan);
superAdminRouter.put('/plans/:id', validateRequest(v.updateSubscriptionPlanSchema), SuperAdminController.updateSubscriptionPlan);
superAdminRouter.delete('/plans/:id', SuperAdminController.deleteSubscriptionPlan);

superAdminRouter.patch('/schools/:id/features', validateRequest(v.updateSchoolFeaturesSchema), SuperAdminController.updateSchoolFeatures);

/**
 * @openapi
 * /super-admin/settings:
 *   get:
 *     tags:
 *       - Super Admin Settings
 *     summary: Get global platform settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.get('/settings', SuperAdminController.getPlatformSettings);

/**
 * @openapi
 * /super-admin/settings:
 *   put:
 *     tags:
 *       - Super Admin Settings
 *     summary: Update global platform settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformName:
 *                 type: string
 *               supportEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
superAdminRouter.put('/settings', validateRequest(v.updateSettingsSchema), SuperAdminController.updatePlatformSettings);

// Additional mapped routes
superAdminRouter.get('/invoices', validateRequest(v.paginationQuerySchema), SuperAdminController.getAllInvoices);
superAdminRouter.post('/announcements/broadcast', validateRequest(v.createAnnouncementSchema), SuperAdminController.broadcastAnnouncement);
superAdminRouter.post('/notifications/push', validateRequest(v.createNotificationSchema), SuperAdminController.pushNotification);
superAdminRouter.get('/tickets', validateRequest(v.paginationQuerySchema), SuperAdminController.getAllTickets);
superAdminRouter.patch('/tickets/:id/status', validateRequest(v.updateTicketStatusSchema), SuperAdminController.updateTicketStatus);

// CMS Routes
superAdminRouter.get('/cms', SuperAdminController.getCMSPages);
superAdminRouter.post('/cms/faqs', validateRequest(v.createFaqSchema), SuperAdminController.createFAQ);
superAdminRouter.put('/cms/faqs/:id', validateRequest(v.createFaqSchema), SuperAdminController.updateFAQ);
superAdminRouter.delete('/cms/faqs/:id', SuperAdminController.deleteFAQ);

superAdminRouter.put('/cms/terms', validateRequest(v.createTermsPrivacySchema), SuperAdminController.upsertTerms);
superAdminRouter.put('/cms/privacy', validateRequest(v.createTermsPrivacySchema), SuperAdminController.upsertPrivacy);
