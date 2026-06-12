import { Router } from 'express';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getStockItems,
  getSuppliers,
  getPurchaseOrders,
  getDispatchLogs,
  dispatchStock,
  createPurchaseOrder,
  approvePurchaseOrder
} from '../../controllers/inventory.controller.js';

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticateToken);

// All inventory endpoints require SUPER_ADMIN or ADMIN
inventoryRoutes.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

inventoryRoutes.get('/stock', asyncHandler(getStockItems));
inventoryRoutes.get('/suppliers', asyncHandler(getSuppliers));
inventoryRoutes.get('/purchase-orders', asyncHandler(getPurchaseOrders));
inventoryRoutes.get('/dispatch-logs', asyncHandler(getDispatchLogs));

inventoryRoutes.post('/dispatch', asyncHandler(dispatchStock));
inventoryRoutes.post('/purchase-orders', asyncHandler(createPurchaseOrder));
inventoryRoutes.put('/purchase-orders/:id/approve', asyncHandler(approvePurchaseOrder));
