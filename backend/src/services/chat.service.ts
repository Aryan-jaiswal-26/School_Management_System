import { Types } from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/api-error.js';
import { emitToConversation, emitToUser, emitTyping } from '../socket/index.js';

export class ChatService {
  static async createConversation(schoolId: string, createdBy: string, data: any) {
    const participants = Array.from(new Set([createdBy, ...(data.participants || [])]));
    if (participants.length < 2) throw new ApiError(400, 'A conversation requires at least two participants');

    const type = data.type || (participants.length > 2 ? 'GROUP' : 'DIRECT');

    if (type === 'DIRECT' && participants.length === 2) {
      // Check if a direct conversation already exists between these two users
      const existing = await Conversation.findOne({
        schoolId: new Types.ObjectId(schoolId),
        type: 'DIRECT',
        participants: { 
          $all: participants.map((id: string) => new Types.ObjectId(id)),
          $size: 2
        }
      });
      if (existing) return existing;
    }

    const conversation = await Conversation.create({
      schoolId: new Types.ObjectId(schoolId),
      type,
      title: data.title,
      participants: participants.map((id: string) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(createdBy),
    });

    return conversation;
  }

  static async listConversations(schoolId: string, userId: string) {
    return Conversation.find({ schoolId: new Types.ObjectId(schoolId), participants: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .populate('participants', 'firstName lastName role profilePicture');
  }

  static async getConversationMessages(conversationId: string, userId: string) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: new Types.ObjectId(userId) });
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    return Message.find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .populate('senderId', 'firstName lastName role profilePicture');
  }

  static async sendMessage(schoolId: string, senderId: string, data: any) {
    const conversation = await Conversation.findOne({
      _id: data.conversationId,
      schoolId: new Types.ObjectId(schoolId),
      participants: new Types.ObjectId(senderId),
    });

    if (!conversation) throw new ApiError(404, 'Conversation not found');

    const message = await Message.create({
      schoolId: new Types.ObjectId(schoolId),
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      text: data.text,
      attachments: data.attachments || [],
      replyTo: data.replyTo ? new Types.ObjectId(data.replyTo) : undefined,
      readBy: [new Types.ObjectId(senderId)],
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate('senderId', 'firstName lastName role profilePicture');

    emitToConversation(conversation._id.toString(), 'message:new', populated);
    conversation.participants.forEach((participant) => {
      emitToUser(participant.toString(), 'conversation:update', { conversationId: conversation._id.toString(), lastMessageAt: new Date() });
    });

    return populated;
  }

  static async markMessagesRead(conversationId: string, userId: string) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: new Types.ObjectId(userId) });
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    await Message.updateMany(
      { conversationId: new Types.ObjectId(conversationId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
    );

    const unreadMessages = await Message.find({ conversationId: new Types.ObjectId(conversationId) });
    emitToConversation(conversationId, 'message:read', { conversationId, userId, messageIds: unreadMessages.map((m) => m._id.toString()) });

    return { conversationId, userId, status: 'read' };
  }

  static async toggleTyping(conversationId: string, userId: string, isTyping: boolean) {
    emitTyping(conversationId, userId, isTyping);
    return { conversationId, userId, isTyping };
  }

  static async deleteConversation(conversationId: string, userId: string) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: new Types.ObjectId(userId) });
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    // Hard delete for all participants (as requested)
    await Message.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
    await Conversation.deleteOne({ _id: conversationId });

    emitToConversation(conversationId, 'conversation:delete', { conversationId });
  }

  static async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const message = await Message.findOne({ _id: messageId, conversationId: new Types.ObjectId(conversationId) });
    if (!message) throw new ApiError(404, 'Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ApiError(403, 'You can only delete your own messages');
    }

    await Message.deleteOne({ _id: messageId });
    emitToConversation(conversationId, 'message:delete', { conversationId, messageId });
  }
}
