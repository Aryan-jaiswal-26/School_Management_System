import { Router } from 'express';
import { GSTInvoiceController } from '../../controllers/gst-invoice.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const gstInvoiceRouter = Router();
gstInvoiceRouter.use(authenticateToken);

gstInvoiceRouter.get('/', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), asyncHandler(GSTInvoiceController.list));
gstInvoiceRouter.post('/', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), asyncHandler(GSTInvoiceController.create));
gstInvoiceRouter.get('/:id', asyncHandler(GSTInvoiceController.getById));
gstInvoiceRouter.get('/:id/download', asyncHandler(GSTInvoiceController.download));
gstInvoiceRouter.patch('/:id/status', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), asyncHandler(GSTInvoiceController.updateStatus));
