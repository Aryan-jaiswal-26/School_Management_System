import type { NextFunction, Request, Response } from 'express';
import { ChatService } from '../services/chat.service.js';
import { sendResponse } from '../utils/response.js';

export class ChatController {
  static async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const conversation = await ChatService.createConversation(schoolId, userId, req.body);
      sendResponse(res, 201, 'Conversation created', conversation);
    } catch (error) {
      next(error);
    }
  }

  static async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const conversations = await ChatService.listConversations(schoolId, userId);
      sendResponse(res, 200, 'Conversations retrieved', conversations);
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      const messages = await ChatService.getConversationMessages(conversationId, userId);
      sendResponse(res, 200, 'Messages retrieved', messages);
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const message = await ChatService.sendMessage(schoolId, userId, { ...req.body, conversationId: req.params.conversationId });
      sendResponse(res, 201, 'Message sent', message);
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      const result = await ChatService.markMessagesRead(conversationId, userId);
      sendResponse(res, 200, 'Messages marked as read', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const conversationId = req.params.conversationId as string;
      await ChatService.deleteConversation(conversationId, userId);
      sendResponse(res, 204, 'Conversation deleted');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string | undefined;
      if (!userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const { conversationId, messageId } = req.params;
      await ChatService.deleteMessage(conversationId as string, messageId as string, userId as string);
      sendResponse(res, 204, 'Message deleted');
    } catch (error) {
      next(error);
    }
  }
}
