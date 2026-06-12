import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { createSocketClient, fetchConversations, fetchMessages, sendMessage, deleteConversation, deleteMessage, markRead, type ChatConversation, type ChatMessage } from "@/lib/chat-api";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Send,
  Search,
  Bell,
  AlertTriangle,
  Plus,
  CheckCircle,
  Mail,
  MessageSquare,
  X,
  User,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";

const genId = () => Math.random().toString(36).substr(2, 9);

export const Route = createFileRoute("/teacher/messages")({
  head: () => ({ meta: [{ title: "Messages & Notices · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"direct" | "notices">("direct");

  // -- Compose State for Notices --
  const [announcementsStore, setAnnouncementsStore] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"all" | "students" | "teachers" | "staff">("students");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");

  const announcements = announcementsStore.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesTarget = targetFilter === "all" || a.target === targetFilter;
    return matchesSearch && matchesTarget;
  });

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newAnnouncement = {
      id: genId(),
      title,
      content,
      author: user?.name || "Teacher",
      date: new Date().toISOString().split("T")[0],
      target,
      priority,
    };

    setAnnouncementsStore((prev) => [newAnnouncement, ...prev]);
    toast.success("Notice published successfully!", {
      description: `Announcement targeted to ${target} is now active.`,
    });

    setTitle("");
    setContent("");
    setShowCompose(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 uppercase">
            <AlertTriangle className="h-3 w-3" /> Urgent
          </span>
        );
      case "important":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-500 uppercase">
            <Bell className="h-3 w-3" /> Important
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500 uppercase">
            <CheckCircle className="h-3 w-3" /> Normal
          </span>
        );
    }
  };

  const getTargetBadge = (target: string) => {
    const targetMap: Record<string, string> = {
      all: "Everyone",
      students: "Students & Parents",
      teachers: "Teachers Portal",
      staff: "General Staff",
    };
    return (
      <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full font-medium">
        {targetMap[target] || target}
      </span>
    );
  };

  // -- Direct Messages State --
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUser, setTypingUser] = useState<string>("");

  // -- New Chat Modal State --
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      setLoadingChats(true);
      try {
        const data = await fetchConversations();
        setConversations(data);
        if (!selectedChat && data.length > 0) setSelectedChat(data[0]._id);
      } catch (error) {
        console.error("Failed to load conversations", error);
        toast.error("Unable to load conversation list right now.");
      } finally {
        setLoadingChats(false);
      }
    };

    void loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedChat) return;

    const loadMessages = async () => {
      try {
        const data = await fetchMessages(selectedChat);
        setMessages(data);
        await markRead(selectedChat);
      } catch (error) {
        console.error("Failed to load messages", error);
        setMessages([]);
      }
    };

    void loadMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = createSocketClient(user.id);

    socket.on("message:new", (payload: ChatMessage & { conversationId?: string }) => {
      if (payload.conversationId === selectedChat) {
        setMessages((prev) => (prev.some((item) => item._id === payload._id) ? prev : [...prev, payload]));
      }
    });

    socket.on("conversation:update", (payload: { conversationId?: string }) => {
      if (!payload.conversationId) return;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === payload.conversationId
            ? { ...conversation, lastMessageAt: new Date().toISOString() }
            : conversation
        )
      );
    });

    socket.on("typing", (payload: { conversationId?: string; userId?: string; isTyping?: boolean }) => {
      if (payload.conversationId === selectedChat && payload.userId && payload.userId !== user.id) {
        setTypingUser(payload.isTyping ? payload.userId : "");
      }
    });

    socket.on("message:delete", (payload: { conversationId: string; messageId: string }) => {
      if (payload.conversationId === selectedChat) {
        setMessages(prev => prev.filter(m => m._id !== payload.messageId));
      }
    });

    socket.on("conversation:delete", (payload: { conversationId: string }) => {
      setConversations(prev => prev.filter(c => c._id !== payload.conversationId));
      if (selectedChat === payload.conversationId) setSelectedChat("");
    });

    socket.on("message:read", (payload: { conversationId: string; userId: string; messageIds: string[] }) => {
      if (payload.conversationId === selectedChat) {
        setMessages(prev => prev.map(msg => 
          payload.messageIds.includes(msg._id) 
            ? { ...msg, readBy: [...(msg.readBy || []), payload.userId] }
            : msg
        ));
      }
    });

    return () => {
      socket.off("message:new");
      socket.off("conversation:update");
      socket.off("typing");
      socket.off("message:delete");
      socket.off("conversation:delete");
      socket.off("message:read");
      socket.disconnect();
    };
  }, [selectedChat, user?.id]);

  const activeChatData = conversations.find((c) => c._id === selectedChat);
  const activeChatName =
    activeChatData?.title ||
    activeChatData?.participants
      .filter((participant) => participant._id !== user?.id)
      .map((participant) => `${participant.firstName || ""} ${participant.lastName || ""}`.trim())
      .join(", ") ||
    "Select a conversation";

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      const freshMessage = await sendMessage(selectedChat, chatInput.trim());
      setMessages((prev) => [...prev, freshMessage]);
      setChatInput("");
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error("Message could not be sent. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setLoadingUsers(true);
    try {
      const data = await apiClient<any[]>('/users?role=STUDENT');
      const unique = Array.from(new Map((data || []).map(t => [t.id, t])).values());
      setAvailableUsers(unique);
    } catch (err) {
      toast.error("Failed to fetch students.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateChat = async (userId: string) => {
    try {
      // Create a conversation
      const newConversation = await apiClient<any>('/chat', {
        method: "POST",
        data: {
          type: "DIRECT",
          participants: [userId]
        }
      });
      toast.success("Conversation started!");
      setShowNewChatModal(false);
      
      // Update local state
      setConversations((prev) => {
        const exists = prev.find(c => c._id === newConversation._id);
        if (exists) return prev;
        return [newConversation, ...prev];
      });
      setSelectedChat(newConversation._id);
    } catch (error: any) {
      toast.error(error.message || "Failed to create conversation");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    if (!confirm("Are you sure you want to delete this conversation for everyone?")) return;

    try {
      await deleteConversation(selectedChat);
      setConversations(prev => prev.filter(c => c._id !== selectedChat));
      setSelectedChat("");
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedChat) return;
    if (!confirm("Delete this message?")) return;

    try {
      await deleteMessage(selectedChat, msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications Hub"
        subtitle="Direct Messaging with parents & staff, plus school-wide notice board."
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("direct")}
          className={`pb-3 px-2 text-sm font-bold tracking-wide uppercase transition-all border-b-2 ${activeTab === "direct" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setActiveTab("notices")}
          className={`pb-3 px-2 text-sm font-bold tracking-wide uppercase transition-all border-b-2 ${activeTab === "notices" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Broadcast Notices
        </button>
      </div>

      {activeTab === "direct" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] animate-in fade-in">
          {/* Contacts List */}
          <div className="lg:col-span-1 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="relative flex-1 mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={handleOpenNewChat}
                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-accent text-white hover:bg-accent/90"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="p-4 text-sm text-muted-foreground">Loading conversations…</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No conversations found yet.</div>
              ) : (
                conversations.map((chat) => {
                  const preview = chat.title || chat.participants.filter((p) => p._id !== user?.id).map((p) => `${p.firstName || ""} ${p.lastName || ""}`.trim()).join(", ");
                  return (
                    <button
                      key={chat._id}
                      onClick={() => setSelectedChat(chat._id)}
                      className={`w-full text-left p-4 flex items-start gap-3 border-b border-border transition-all ${selectedChat === chat._id ? "bg-accent/5 border-l-4 border-l-accent" : "hover:bg-muted/50 border-l-4 border-l-transparent"}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">{preview}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground truncate pr-2">{chat.type} conversation</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 border border-border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
            {activeChatData ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{activeChatName}</h3>
                      <span className="text-xs text-emerald-500 font-medium">{typingUser ? "Typing…" : "Online"}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteChat}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground my-4">
                    Live conversation
                  </div>
                  {messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId?._id === user?.id;
                      const isRead = msg.readBy?.some(id => id !== user?.id);
                      return (
                        <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"} group relative`}>
                          {isMine && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Message"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? "bg-accent text-white rounded-tr-sm"
                                : "bg-background border border-border rounded-tl-sm text-foreground"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMine ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                              <span>{new Date(msg.createdAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                              {isMine && (
                                isRead ? <CheckCheck className="h-3 w-3 text-blue-200" /> : <Check className="h-3 w-3 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={selectedChat ? "Type your message..." : "Select a conversation first"}
                      disabled={!selectedChat || sendingMessage}
                      className="flex-1 h-10 px-4 rounded-full bg-muted/50 border border-border outline-none focus:border-accent text-sm transition-colors disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!selectedChat || sendingMessage}
                      className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-semibold">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "notices" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in">
          {/* Left Side Compose Panel */}
          <div className="lg:col-span-1 space-y-4">
            {showCompose ? (
              <Panel title="Compose Announcement">
                <form onSubmit={handleCompose} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Notice Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Mathematics Mid-Term Schedule"
                      required
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Target Audience
                      </label>
                      <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value as any)}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                      >
                        <option value="students">Students & Parents</option>
                        <option value="teachers">Teachers Only</option>
                        <option value="staff">All Staff</option>
                        <option value="all">Everyone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                      >
                        <option value="normal">Normal</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Message Content
                    </label>
                    <textarea
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write detailed announcement..."
                      required
                      className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Publish Notice
                    </button>
                  </div>
                </form>
              </Panel>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <button
                  onClick={() => setShowCompose(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Announcement
                </button>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="rounded-lg bg-accent/10 p-2.5 text-accent">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm">Need Broadcast?</h4>
                    <p className="text-xs text-muted-foreground">
                      Select audiences to push instant notifications.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => toast.info("Broadcasting email batch (simulated)...")}
                    className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email Broadcast
                  </button>
                  <button
                    onClick={() => toast.info("Broadcasting SMS notifications (simulated)...")}
                    className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    SMS Broadcast
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side Announcement List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search announcements..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
              >
                <option value="all">All Targets</option>
                <option value="students">Students/Parents</option>
                <option value="teachers">Teachers</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>

            <Panel title="Active Notices & Bulletins">
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold">No announcements published</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Click "New Announcement" to publish your first bulletin.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-xl border border-border p-5 bg-card hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-base text-foreground">{ann.title}</h4>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {getTargetBadge(ann.target)}
                            {getPriorityIcon(ann.priority)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{ann.date}</div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                      <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between border-t border-border">
                        <span>
                          Posted by{" "}
                          <span className="font-semibold text-foreground">{ann.author}</span>
                        </span>
                        <button
                          onClick={() => {
                            setAnnouncementsStore(prev => prev.filter(a => a.id !== ann.id));
                            toast.success("Notice deleted.");
                          }}
                          className="text-xs text-destructive hover:underline"
                        >
                          Delete Notice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-foreground">Start New Chat with Student</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              
              {loadingUsers ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading students...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No students found.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleCreateChat(user.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm text-foreground">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </div>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
