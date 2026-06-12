import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';
import { sendResponse } from '../utils/response.js';

export class SupportController {
  /**
   * GET /support
   * Returns all tickets raised by the calling user.
   * Admins see all tickets for the school.
   */
  static async list(req: Request, res: Response): Promise<Response> {
    const user     = (req as any).user;
    const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip     = (page - 1) * limit;

    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    const filter: Record<string, unknown> = isAdmin
      ? { schoolId: new mongoose.Types.ObjectId(user.schoolId) }
      : { userId: new mongoose.Types.ObjectId(user.id) };

    if (req.query.status)   filter.status   = String(req.query.status).toUpperCase();
    if (req.query.category) filter.category = String(req.query.category).toUpperCase();
    if (req.query.priority) filter.priority = String(req.query.priority).toUpperCase();

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return sendResponse(res, 200, 'Tickets fetched successfully', {
      tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  /**
   * POST /support
   * Create a new support ticket.
   */
  static async create(req: Request, res: Response): Promise<Response> {
    const user     = (req as any).user;
    const schoolId = user?.schoolId;

    const { subject, description, category, priority } = req.body;

    if (!subject || !description || !category) {
      return sendResponse(res, 400, 'subject, description, and category are required');
    }

    const validCategories = ['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'ACCOUNT'];
    if (!validCategories.includes(String(category).toUpperCase())) {
      return sendResponse(res, 400, `category must be one of ${validCategories.join(', ')}`);
    }

    const ticket = await SupportTicket.create({
      schoolId: schoolId ? new mongoose.Types.ObjectId(schoolId) : undefined,
      userId:   new mongoose.Types.ObjectId(user.id),
      subject:  String(subject).trim(),
      description: String(description).trim(),
      category: String(category).toUpperCase(),
      priority: priority ? String(priority).toUpperCase() : 'MEDIUM',
      status:   'OPEN',
      comments: [],
    });

    return sendResponse(res, 201, 'Support ticket created successfully', { ticket });
  }

  /**
   * GET /support/:id
   * Get a single ticket by ID. The ticket must belong to the calling user, or the caller must be an admin.
   */
  static async getById(req: Request, res: Response): Promise<Response> {
    const { id }  = req.params;
    const user    = (req as any).user;
    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, 'Invalid ticket id');
    }

    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'name email')
      .populate('comments.userId', 'name email role')
      .lean();

    if (!ticket) return sendResponse(res, 404, 'Ticket not found');

    // Access control: only the owner or admin can see the ticket
    const isOwner = ticket.userId.toString() === String(user.id);
    if (!isOwner && !isAdmin) {
      return sendResponse(res, 403, 'You are not authorised to view this ticket');
    }

    return sendResponse(res, 200, 'Ticket fetched successfully', { ticket });
  }

  /**
   * POST /support/:id/messages
   * Add a message/reply to a ticket. Owner and admins can reply.
   */
  static async addMessage(req: Request, res: Response): Promise<Response> {
    const { id }  = req.params;
    const user    = (req as any).user;
    const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, 'Invalid ticket id');
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return sendResponse(res, 404, 'Ticket not found');

    // Access control
    const isOwner = ticket.userId.toString() === String(user.id);
    if (!isOwner && !isAdmin) {
      return sendResponse(res, 403, 'You are not authorised to reply to this ticket');
    }

    if (ticket.status === 'CLOSED') {
      return sendResponse(res, 400, 'Cannot add a message to a closed ticket');
    }

    const { message } = req.body;
    if (!message) return sendResponse(res, 400, 'message is required');

    const comment = {
      userId:    new mongoose.Types.ObjectId(user.id),
      message:   String(message).trim(),
      createdAt: new Date(),
    };

    ticket.comments.push(comment as any);

    // Auto-update status: if admin is replying to an OPEN ticket, move to IN_PROGRESS
    if (isAdmin && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    return sendResponse(res, 201, 'Message added successfully', {
      comment,
      status: ticket.status,
    });
  }
}
