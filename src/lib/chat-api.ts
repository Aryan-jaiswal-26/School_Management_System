import { apiClient } from "@/lib/api-client";
import { io, type Socket } from "socket.io-client";

export interface ChatConversation {
  _id: string;
  title?: string;
  type: string;
  participants: Array<{ _id: string; firstName?: string; lastName?: string; role?: string; profilePicture?: string }>;
  lastMessageAt?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: { _id: string; firstName?: string; lastName?: string; role?: string; profilePicture?: string };
  text?: string;
  attachments?: string[];
  createdAt: string;
  readBy?: string[];
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  return apiClient<ChatConversation[]>("/chat");
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>(`/chat/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, text: string) {
  return apiClient<ChatMessage>(`/chat/${conversationId}/messages`, {
    method: "POST",
    data: { text },
  });
}

export async function createConversation(payload: Record<string, unknown>) {
  return apiClient<ChatConversation>("/chat", {
    method: "POST",
    data: payload,
  });
}

export async function deleteConversation(conversationId: string) {
  return apiClient<void>(`/chat/${conversationId}`, {
    method: "DELETE",
  });
}

export async function deleteMessage(conversationId: string, messageId: string) {
  return apiClient<void>(`/chat/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function markRead(conversationId: string) {
  return apiClient<void>(`/chat/${conversationId}/read`, {
    method: "PATCH",
  });
}

export function createSocketClient(userId: string): Socket {
  const socket = io(`${window.location.origin}`, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    socket.emit("join:user", userId);
  });

  return socket;
}
