import { Router } from 'express';
import { CanteenController } from '../../controllers/canteen.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

export const canteenRouter = Router();

// Require authentication for all canteen routes
canteenRouter.use(authenticateToken);

// Dashboard & Reports (Admins, Canteen Staff)
canteenRouter.get('/dashboard', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.getDashboard);
canteenRouter.get('/reports', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.getReports);

// Settings
canteenRouter.get('/settings', CanteenController.getSettings);
canteenRouter.put('/settings', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.updateSettings);

// Exports
canteenRouter.get('/exports/pdf', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.exportPdf);
canteenRouter.get('/exports/excel', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.exportExcel);

// Menu Items
canteenRouter.get('/menu-items', CanteenController.listMenuItems); // Anyone can view menu items
canteenRouter.post('/menu-items', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), upload.single('image'), CanteenController.createMenuItem);
canteenRouter.put('/menu-items/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), upload.single('image'), CanteenController.updateMenuItem);
canteenRouter.delete('/menu-items/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.deleteMenuItem);

// Daily Menu
canteenRouter.get('/daily-menu', CanteenController.getDailyMenu);
canteenRouter.get('/mess-menu', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.getMessMenu);
canteenRouter.put('/mess-menu', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.updateMessMenu);

// Orders
canteenRouter.get('/orders', CanteenController.listOrders);
canteenRouter.post('/orders', CanteenController.createOrder); // Students, Parents, Admins
canteenRouter.patch('/orders/:id/status', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.updateOrderStatus);
canteenRouter.post('/orders/:id/verify-pickup', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.verifyPickup);
canteenRouter.post('/orders/verify-pickup', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.verifyPickup);

// Wallets (Admin)
canteenRouter.get('/wallets/all', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.listAllWallets);
canteenRouter.get('/transactions/all', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.listAllTransactions);
canteenRouter.put('/wallets/:id/freeze', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.toggleWalletStatus);

// Wallets (Individual)
canteenRouter.get('/wallets/:studentId', CanteenController.getWallet);
canteenRouter.post('/wallets/:studentId/top-up', CanteenController.topUpWallet);
canteenRouter.get('/wallets/:studentId/transactions', CanteenController.listTransactions);

// Dietary Profiles
canteenRouter.get('/dietary-profiles', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), CanteenController.listDietaryProfiles);
canteenRouter.get('/dietary-profiles/:studentId', CanteenController.getDietaryProfile);
canteenRouter.post('/dietary-profiles', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), CanteenController.upsertDietaryProfile);


