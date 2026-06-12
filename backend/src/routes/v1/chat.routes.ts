import { Router } from 'express';
import { ChatController } from '../../controllers/chat.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { createConversationSchema, sendMessageSchema } from '../../validations/chat.validation.js';

export const chatRouter = Router();

chatRouter.use(authenticateToken);
chatRouter.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER'));

chatRouter.post('/', validateRequest(createConversationSchema), ChatController.createConversation);
chatRouter.get('/', ChatController.listConversations);
chatRouter.get('/:conversationId/messages', ChatController.getMessages);
chatRouter.post('/:conversationId/messages', validateRequest(sendMessageSchema), ChatController.sendMessage);
chatRouter.patch('/:conversationId/read', ChatController.markRead);
chatRouter.delete('/:conversationId', ChatController.deleteConversation);
chatRouter.delete('/:conversationId/messages/:messageId', ChatController.deleteMessage);

export default chatRouter;
