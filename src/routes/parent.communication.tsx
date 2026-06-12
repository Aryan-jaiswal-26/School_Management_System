import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, CheckCircle, Loader2, MessageSquare, Send, UserX, Video, Search } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { createConversation, fetchConversations, fetchMessages, sendMessage, type ChatConversation, type ChatMessage } from "@/lib/chat-api";
import { fetchChildContacts, fetchChildLeaves, fetchPtmMeetings, submitChildLeave, createPtmMeeting } from "@/lib/parent-api";

export const Route = createFileRoute("/parent/communication")({
  head: () => ({ meta: [{ title: "Teachers & Leaves · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [activeChildId, setActiveChildId] = useState("");
  const [activeChildName, setActiveChildName] = useState("Student");
  const [activeTab, setActiveTab] = useState<"chat" | "leave" | "ptm">("chat");
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [ptmMeetings, setPtmMeetings] = useState<any[]>([]);
  const [newLeaveStatus, setNewLeaveStatus] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setActiveChildId(localStorage.getItem("parent_active_child") || "");
      setActiveChildName(localStorage.getItem("parent_active_child_name") || "Student");
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const reloadData = async (studentId: string) => {
    if (!studentId) return;
    setLoadingChat(true);
    try {
      const [contactsRes, convRes, leavesRes, ptmRes] = await Promise.allSettled([
        fetchChildContacts(studentId),
        fetchConversations(),
        fetchChildLeaves(studentId),
        fetchPtmMeetings(studentId),
      ]);
      setContacts(contactsRes.status === "fulfilled" ? contactsRes.value || [] : []);
      setConversations(convRes.status === "fulfilled" ? convRes.value || [] : []);
      setLeaveRequests(leavesRes.status === "fulfilled" ? leavesRes.value || [] : []);
      setPtmMeetings(ptmRes.status === "fulfilled" ? ptmRes.value || [] : []);
      const teachers = contactsRes.status === "fulfilled" ? contactsRes.value || [] : [];
      setSelectedTeacher((prev: any) => prev || teachers[0] || null);
      const existing = (convRes.status === "fulfilled" ? convRes.value || [] : []).find((conv: ChatConversation) =>
        conv.participants.some((participant) => participant._id !== undefined && participant._id === teachers?.[0]?.teacherId),
      );
      if (existing) {
        setSelectedConversation(existing._id);
        const msgs = await fetchMessages(existing._id);
        setMessages(msgs || []);
      } else if (teachers[0]) {
        const created = await createConversation({
          type: "PARENT_TEACHER",
          title: `${activeChildName} ↔ ${teachers[0].teacherName}`,
          participants: [teachers[0].teacherId],
        } as any);
        setSelectedConversation(created._id);
        setConversations((prev) => [created, ...prev]);
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load communication data");
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (activeChildId) {
      void reloadData(activeChildId);
    }
  }, [activeChildId]);

  const openTeacherChat = async (teacher: any) => {
    setSelectedTeacher(teacher);
    try {
      const existing = conversations.find((conversation) =>
        conversation.participants.some((participant) => participant._id === teacher.teacherId),
      );
      if (existing) {
        setSelectedConversation(existing._id);
        const msgs = await fetchMessages(existing._id);
        setMessages(msgs || []);
        return;
      }

      const created = await createConversation({
        type: "PARENT_TEACHER",
        title: `${activeChildName} ↔ ${teacher.teacherName}`,
        participants: [teacher.teacherId],
      } as any);
      setConversations((prev) => [created, ...prev]);
      setSelectedConversation(created._id);
      setMessages([]);
      toast.success("Chat ready", { description: `Connected with ${teacher.teacherName}.` });
    } catch (error) {
      console.error(error);
      toast.error("Could not open chat with teacher");
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim() || !selectedConversation) return;
    try {
      const sent = await sendMessage(selectedConversation, chatInput.trim());
      setMessages((prev) => [...prev, sent]);
      setChatInput("");
    } catch (error) {
      console.error(error);
      toast.error("Message could not be sent");
    }
  };

  const handleSubmitLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const created = await submitChildLeave(activeChildId, {
        leaveType: formData.get("leaveType"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        reason: formData.get("reason"),
      });
      setLeaveRequests((prev) => [created, ...prev]);
      setNewLeaveStatus("Leave application submitted");
      toast.success("Leave application submitted");
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit leave application");
    }
  };

  const handleRequestPTM = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const meeting = await createPtmMeeting(activeChildId, {
        teacher: String(formData.get("teacher") || selectedTeacher?.teacherName || "Class Teacher"),
        subject: String(formData.get("subject") || "General Progress"),
        dateTime: String(formData.get("dateTime") || new Date().toISOString()),
        type: String(formData.get("type") || "Video Call"),
      });
      setPtmMeetings((prev) => [...prev, meeting]);
      toast.success("PTM request submitted");
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule PTM");
    }
  };

  const chatPartnerLabel = useMemo(() => selectedTeacher?.teacherName || "Teacher", [selectedTeacher]);

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child profile from the top bar to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="School Communications" subtitle={`Chat with teachers, submit leave applications, and schedule PTMs for ${activeChildName}.`} />

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {[
          ["chat", "Direct Chat", MessageSquare],
          ["leave", "Leave Applications", UserX],
          ["ptm", "Schedule PTM", CalendarPlus],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Panel title="Teachers Directory">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent" placeholder="Search teacher..." />
              </div>
              <div className="space-y-2">
                {contacts.map((teacher) => (
                  <button
                    key={teacher.teacherId}
                    onClick={() => openTeacherChat(teacher)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                      selectedTeacher?.teacherId === teacher.teacherId ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {(teacher.teacherName || "T").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{teacher.teacherName}</div>
                      <div className="text-xs text-muted-foreground">{teacher.subject}</div>
                    </div>
                  </button>
                ))}
                {contacts.length === 0 && (
                  <EmptyState icon={MessageSquare} title="No teachers found" description="We could not load teacher contacts for this child." />
                )}
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-2 flex flex-col h-[560px] rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <div className="text-sm font-bold text-foreground">{chatPartnerLabel}</div>
                <div className="text-xs text-muted-foreground">Parent-teacher conversation</div>
              </div>
              <button className="h-9 w-9 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary flex items-center justify-center transition-colors" title="Start Video Call">
                <Video className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading chat...
                </div>
              ) : messages.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No messages yet" description="Start the conversation with your child's teacher." />
              ) : (
                messages.map((message) => (
                  <div key={message._id} className={`flex ${message.senderId?._id === selectedTeacher?.teacherId ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 text-sm ${message.senderId?._id === selectedTeacher?.teacherId ? "rounded-tl-sm bg-muted text-foreground" : "rounded-tr-sm bg-primary text-primary-foreground"}`}>
                      {message.text}
                      <div className={`text-[10px] mt-1 text-right ${message.senderId?._id === selectedTeacher?.teacherId ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-background flex gap-2">
              <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="Type your message..." />
              <button type="submit" className="h-10 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "leave" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Submit Leave Application">
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Leave Type</label>
                <select name="leaveType" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent">
                  <option value="PERSONAL">Personal</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="FAMILY">Family</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</label>
                  <input name="startDate" type="date" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">End Date</label>
                  <input name="endDate" type="date" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Reason</label>
                <textarea name="reason" rows={4} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="Explain the leave request..." />
              </div>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Submit Leave Request
              </button>
              {newLeaveStatus && <div className="text-xs text-emerald-600 font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4" />{newLeaveStatus}</div>}
            </form>
          </Panel>

          <Panel title="Leave History">
            <div className="space-y-3">
              {leaveRequests.map((leave) => (
                <div key={leave._id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">{leave.leaveType || leave.status}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">{leave.status}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{leave.reason}</p>
                </div>
              ))}
              {leaveRequests.length === 0 && <EmptyState icon={UserX} title="No leave requests" description="Submitted leave applications will appear here." />}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "ptm" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Request Parent-Teacher Meeting">
            <form onSubmit={handleRequestPTM} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Teacher</label>
                <input name="teacher" defaultValue={selectedTeacher?.teacherName || ""} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Topic</label>
                <input name="subject" defaultValue="General Progress" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date & Time</label>
                <input name="dateTime" type="datetime-local" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Mode</label>
                <select name="type" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent">
                  <option value="Video Call">Video Call</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Request PTM
              </button>
            </form>
          </Panel>

          <Panel title="Scheduled Meetings">
            <div className="space-y-3">
              {ptmMeetings.map((meeting) => (
                <div key={meeting._id || meeting.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="text-sm font-semibold text-foreground">{meeting.teacherName || meeting.teacher}</div>
                  <div className="text-xs text-muted-foreground mt-1">{meeting.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">{meeting.dateTime || meeting.scheduledAt}</div>
                </div>
              ))}
              {ptmMeetings.length === 0 && <EmptyState icon={CalendarPlus} title="No PTMs yet" description="Book a meeting and it will appear here." />}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
