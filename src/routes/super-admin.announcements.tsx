import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { Megaphone, Calendar, Send, History } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/announcements")({
  component: SuperAdminAnnouncements,
});

function SuperAdminAnnouncements() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("compose");
  const [page, setPage] = useState(1);

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['superAdmin', 'announcements', page],
    queryFn: () => SuperAdminAPI.getAnnouncements({ page, limit: 10 })
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: SuperAdminAPI.broadcastAnnouncement,
    onSuccess: () => {
      toast.success("Announcement broadcasted successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'announcements'] });
      setActiveTab("history");
      // Reset form
      (document.getElementById('ann-title') as HTMLInputElement).value = '';
      (document.getElementById('ann-body') as HTMLTextAreaElement).value = '';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to broadcast announcement");
    }
  });

  const handleBroadcast = () => {
    const title = (document.getElementById('ann-title') as HTMLInputElement).value;
    const content = (document.getElementById('ann-body') as HTMLTextAreaElement).value;
    const audience = (document.getElementById('ann-audience') as HTMLSelectElement).value;

    if (!title || !content) {
      toast.error("Please fill in the title and message body");
      return;
    }

    const audienceMap: Record<string, "ALL" | "SCHOOL_ADMINS" | "TEACHERS" | "STUDENTS" | "PARENTS"> = {
      "All": "ALL",
      "School Admins": "SCHOOL_ADMINS",
      "Teachers": "TEACHERS",
      "Students": "STUDENTS",
      "Parents": "PARENTS",
    };
    const mappedAudience = audienceMap[audience] || "ALL";

    createAnnouncementMutation.mutate({
      title,
      content,
      targetAudience: mappedAudience,
      status: "Published"
    });
  };

  const announcements = announcementsData?.data || [];
  const totalPages = announcementsData?.totalPages || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Announcements"
        description="Broadcast important updates, alerts, and feature releases to all tenants."
      />

      <div className="flex space-x-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80 max-w-md">
        <button
          onClick={() => setActiveTab("compose")}
          className={`flex-1 flex justify-center items-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === "compose"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Megaphone className="h-4 w-4" /> Compose
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex justify-center items-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
            activeTab === "history"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <History className="h-4 w-4" /> History
        </button>
      </div>

      {activeTab === "compose" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm max-w-3xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-500" />
            New Broadcast
          </h3>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Announcement Title</label>
              <input id="ann-title" type="text" placeholder="e.g. Scheduled Maintenance" className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message Body</label>
              <textarea id="ann-body" rows={6} placeholder="Type your message here..." className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 resize-none"></textarea>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <select id="ann-audience" className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <option value="All">All Schools</option>
                  <option value="School Admins">School Admins Only</option>
                  <option value="Teachers">Teachers Only</option>
                  <option value="Students">Students Only</option>
                  <option value="Parents">Parents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Time</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="datetime-local" className="w-full rounded-md border border-slate-300 p-2.5 pl-10 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button 
                type="button" 
                onClick={handleBroadcast}
                disabled={createAnnouncementMutation.isPending}
                className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {createAnnouncementMutation.isPending ? "Scheduling..." : "Schedule Broadcast"}
              </button>
              <button type="button" className="rounded-md bg-slate-100 dark:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                Save Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Target Audience</th>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No announcements found.</td>
                  </tr>
                ) : announcements.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.title}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.targetAudience}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold
                        ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}
                      `}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {activeTab === "history" && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
