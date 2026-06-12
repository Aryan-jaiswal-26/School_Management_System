import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(server: Server): void {
  io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("join:user", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("typing", (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      socket.to(`conversation:${payload.conversationId}`).emit("typing", payload);
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitToConversation(conversationId: string, event: string, payload: unknown): void {
  io?.to(`conversation:${conversationId}`).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitTyping(conversationId: string, userId: string, isTyping: boolean): void {
  emitToConversation(conversationId, "typing", { conversationId, userId, isTyping });
}

export function broadcastNotification(payload: unknown): void {
  io?.emit("notification", payload);
}