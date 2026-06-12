import { Router } from 'express';
import { HostelController } from '../../controllers/hostel.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

export const hostelRouter = Router();

// Ensure all routes require authentication
hostelRouter.use(authenticateToken);

// Base Hostel CRUD
hostelRouter.get('/', HostelController.getHostels);
hostelRouter.post('/', HostelController.createHostel);
hostelRouter.patch('/:id', HostelController.updateHostel);
hostelRouter.delete('/:id', HostelController.deleteHostel);

// Dynamic Structure Configuration
hostelRouter.post('/structure', HostelController.generateStructure);
hostelRouter.get('/structure', HostelController.getStructure);

// Room & Bed Allotment
hostelRouter.get('/allocations', HostelController.getAllocations);
hostelRouter.post('/allocations', HostelController.allocateBed);
hostelRouter.post('/allocations/vacate', HostelController.vacateBed);
hostelRouter.post('/allocations/transfer', HostelController.transferAllocation);

// Fees Management
hostelRouter.post('/fees/plans', HostelController.createFeePlan);
hostelRouter.get('/fees/plans', HostelController.getFeePlans);
hostelRouter.post('/fees/invoices', HostelController.issueFeeInvoice);
hostelRouter.get('/fees/invoices', HostelController.getFeeInvoices);
hostelRouter.patch('/fees/invoices/:id/status', HostelController.toggleInvoiceStatus);
hostelRouter.post('/fees/payments', HostelController.recordFeePayment);

// Gatepass / Movement
hostelRouter.post('/movement', HostelController.recordMovement);

// Communication
hostelRouter.post('/messages', HostelController.createMessage);
hostelRouter.get('/messages', HostelController.getMessages);

// Analytics
hostelRouter.get('/analytics', HostelController.getAnalytics);

// Legacy/Existing Compatibility Routes
hostelRouter.get('/rooms', HostelController.getHostelRooms);
hostelRouter.patch('/rooms/:block/:roomNo', HostelController.updateHostelRoom);
hostelRouter.post('/complaints', HostelController.createHostelComplaint);
hostelRouter.get('/complaints', HostelController.getHostelComplaints);
hostelRouter.patch('/complaints/:id', HostelController.updateHostelComplaint);

hostelRouter.post('/visitors', HostelController.createHostelVisitor);
hostelRouter.get('/visitors', HostelController.getHostelVisitors);
hostelRouter.patch('/visitors/:id', HostelController.updateHostelVisitor);

hostelRouter.post('/rooms/:block/:roomNo/allocate', HostelController.allocateRoom);
hostelRouter.post('/rooms/:block/:roomNo/deallocate', HostelController.deallocateRoom);

hostelRouter.post('/leaves', HostelController.createHostelLeave);
hostelRouter.get('/leaves', HostelController.getHostelLeaves);
hostelRouter.patch('/leaves/:id/status', HostelController.updateHostelLeaveStatus);

hostelRouter.post('/attendance', HostelController.recordHostelAttendance);
hostelRouter.get('/attendance', HostelController.getHostelAttendance);

hostelRouter.post('/notices', HostelController.createHostelNotice);
hostelRouter.get('/notices', HostelController.getHostelNotices);
