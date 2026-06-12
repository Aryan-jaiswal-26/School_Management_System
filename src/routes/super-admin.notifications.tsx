import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { Send, Bell, Smartphone, Clock, Users } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/notifications")({
  component: SuperAdminNotifications,
});

function SuperAdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Platform Users");

  const pushNotificationMutation = useMutation({
    mutationFn: SuperAdminAPI.pushNotification,
    onSuccess: () => {
      toast.success("Push notification sent successfully!");
      setTitle("");
      setBody("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send notification");
    }
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in both the title and message body.");
      return;
    }
    pushNotificationMutation.mutate({
      title,
      message: body,
      type: 'SYSTEM_ALERT',
      channels: ['PUSH']
    });
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications"
        description="Send real-time mobile and web push notifications to users across the platform."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            Compose Notification
          </h3>
          
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Notification Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Update Complete" 
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Message Body</label>
              <textarea 
                rows={4} 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your push notification message..." 
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">{body.length}/150 characters</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" /> Target Audience
                </label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option>All Platform Users</option>
                  <option>School Admins Only</option>
                  <option>Teachers Only</option>
                  <option>Students & Parents</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" /> Schedule Delivery
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="schedule" defaultChecked className="text-indigo-600 focus:ring-indigo-600" />
                    Send Now
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="schedule" className="text-indigo-600 focus:ring-indigo-600" />
                    Schedule for Later
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="button" 
                onClick={handleSend}
                disabled={pushNotificationMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {pushNotificationMutation.isPending ? "Sending..." : (
                  <>
                    <Send className="h-4 w-4" /> Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-800/20 p-6 flex items-center justify-center min-h-[500px]">
          <div className="w-[300px] h-[600px] bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl relative border-[8px] border-slate-800 flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl"></div>
            
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-white dark:from-slate-900 dark:to-slate-950 p-4">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 text-xs font-medium mb-6">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-3 bg-slate-800 dark:bg-slate-200 rounded-sm"></div>
                    <div className="w-4 h-3 bg-slate-800 dark:bg-slate-200 rounded-sm"></div>
                  </div>
                </div>

                {/* Mock Notification Bubble */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mt-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 rounded-lg p-1.5">
                        <Smartphone className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Campus OS</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">now</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 leading-tight">
                    {title || "Notification Title"}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-3">
                    {body || "This is how your push notification will appear on a user's mobile device. Keep it concise and actionable."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
