import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState } from "react";
import { LifeBuoy, Search, Filter, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/support")({
  component: SuperAdminSupport,
});

function SuperAdminSupport() {
  const queryClient = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['superAdmin', 'tickets', statusFilter],
    queryFn: () => SuperAdminAPI.getSupportTickets({
      limit: 50,
      ...(statusFilter !== 'All' && { status: statusFilter })
    })
  });

  const TICKETS = ticketsData?.data?.data || [];
  const activeTicket = TICKETS.find((t: any) => t._id === activeTicketId) || TICKETS[0];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => SuperAdminAPI.updateSupportTicketStatus(id, status),
    onSuccess: () => {
      toast.success("Ticket status updated");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'tickets'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string, message: string }) => SuperAdminAPI.replyToSupportTicket(id, message),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'tickets'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send reply");
    }
  });

  const handleSendReply = () => {
    if (!reply.trim() || !activeTicket) return;
    replyMutation.mutate({ id: activeTicket._id, message: reply });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <PageHeader
        title="Support & SLA"
        description="Manage cross-tenant support tickets and technical assistance requests."
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Ticket List */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search tickets..." className="w-full rounded-md border border-slate-300 pl-9 pr-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>}
            {!isLoading && TICKETS.length === 0 && <div className="p-8 text-center text-slate-500">No tickets found.</div>}
            {TICKETS.map((ticket: any) => (
              <div 
                key={ticket._id} 
                onClick={() => setActiveTicketId(ticket._id)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  activeTicket?._id === ticket._id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">{ticket.ticketNumber || ticket._id.substring(0, 8)}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    ticket.priority === 'High' ? 'bg-rose-100 text-rose-700' : 
                    ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{ticket.subject}</h4>
                <p className="text-xs text-slate-500 mt-1 truncate">{ticket.schoolId?.name || "Unknown School"}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                  <span className={`flex items-center gap-1 ${
                    ticket.status === 'Open' ? 'text-rose-600' : 
                    ticket.status === 'In Progress' ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {ticket.status === 'Open' && <AlertCircle className="h-3 w-3" />}
                    {ticket.status === 'In Progress' && <Clock className="h-3 w-3" />}
                    {ticket.status === 'Closed' && <CheckCircle className="h-3 w-3" />}
                    {ticket.status}
                  </span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details & Reply Panel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{activeTicket.subject}</h2>
                    <p className="text-sm text-muted-foreground">{activeTicket.schoolId?.name} • {activeTicket.ticketNumber || activeTicket._id}</p>
                  </div>
                  <select 
                    value={activeTicket.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: activeTicket._id, status: e.target.value })}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                  >
                    <option value="Open">Mark as Open</option>
                    <option value="In Progress">Mark as In Progress</option>
                    <option value="Closed">Mark as Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold">
                    User
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-border shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm">Customer</span>
                      <span className="text-xs text-slate-500">{new Date(activeTicket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeTicket.description}
                    </p>
                  </div>
                </div>

                {activeTicket.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`flex gap-4 ${msg.senderType === 'SuperAdmin' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                      msg.senderType === 'SuperAdmin' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700'
                    }`}>
                      {msg.senderType === 'SuperAdmin' ? 'SA' : 'User'}
                    </div>
                    <div className={`${
                      msg.senderType === 'SuperAdmin' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 rounded-2xl rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 border-border rounded-2xl rounded-tl-none'
                    } p-4 border shadow-sm flex-1`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{msg.senderType === 'SuperAdmin' ? 'Campus Support' : 'Customer'}</span>
                        <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border bg-white dark:bg-slate-900">
                <div className="relative">
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..." 
                    className="w-full rounded-xl border border-slate-300 pl-4 pr-12 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 resize-none"
                    rows={3}
                  />
                  <button 
                    onClick={handleSendReply}
                    disabled={!reply.trim() || replyMutation.isPending}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {replyMutation.isPending ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <LifeBuoy className="h-12 w-12 mb-4 opacity-50" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
