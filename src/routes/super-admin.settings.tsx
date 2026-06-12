import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect } from "react";
import { Settings, Mail, MessageSquare, Shield, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/settings")({
  component: SuperAdminSettings,
});

function SuperAdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<any>({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['superAdmin', 'settings'],
    queryFn: SuperAdminAPI.getSettings
  });

  const settings = settingsData?.data;

  useEffect(() => {
    if (settings) {
      setFormData({
        general: settings.general || {},
        email: settings.email || {},
        sms: settings.sms || {},
        security: settings.security || {}
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => SuperAdminAPI.updateSettings(newSettings),
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    }
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Settings"
        description="Configure platform-wide settings, integrations, and security policies."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "general"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            <Settings className="h-4 w-4" /> General
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "email"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            <Mail className="h-4 w-4" /> Email Config (SMTP)
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "sms"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> SMS Gateway
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "security"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            <Shield className="h-4 w-4" /> Security & Auth
          </button>
        </div>

        <div className="md:col-span-3">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            {isLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
            ) : (
              <>
            
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">General Configuration</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Platform Name</label>
                      <input type="text" value={formData.general?.platformName || ''} onChange={(e) => handleInputChange('general', 'platformName', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Email</label>
                      <input type="email" value={formData.general?.supportEmail || ''} onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Timezone</label>
                      <select value={formData.general?.timezone || ''} onChange={(e) => handleInputChange('general', 'timezone', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Platform Currency</label>
                      <select value={formData.general?.currency || ''} onChange={(e) => handleInputChange('general', 'currency', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">SMTP Configuration</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">SMTP Host</label>
                      <input type="text" value={formData.email?.smtpHost || ''} onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP Port</label>
                      <input type="number" value={formData.email?.smtpPort || ''} onChange={(e) => handleInputChange('email', 'smtpPort', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Encryption</label>
                      <select value={formData.email?.encryption || ''} onChange={(e) => handleInputChange('email', 'encryption', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <option value="TLS">TLS</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input type="text" value={formData.email?.smtpUser || ''} onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input type="password" value={formData.email?.smtpPass || ''} onChange={(e) => handleInputChange('email', 'smtpPass', e.target.value)} placeholder="••••••••••••••••" className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sms" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">SMS Gateway (Twilio)</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Account SID</label>
                      <input type="text" value={formData.sms?.twilioSid || ''} onChange={(e) => handleInputChange('sms', 'twilioSid', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Auth Token</label>
                      <input type="password" value={formData.sms?.twilioToken || ''} onChange={(e) => handleInputChange('sms', 'twilioToken', e.target.value)} placeholder="••••••••••••••••" className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Sender Number</label>
                      <input type="text" value={formData.sms?.senderNumber || ''} onChange={(e) => handleInputChange('sms', 'senderNumber', e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Global Security Policies</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="text-sm font-medium">Require 2FA for Super Admins</h4>
                        <p className="text-xs text-muted-foreground mt-1">Enforce two-factor authentication for all platform administrators.</p>
                      </div>
                      <div 
                        onClick={() => handleInputChange('security', 'require2FA', !formData.security?.require2FA)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${formData.security?.require2FA ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.security?.require2FA ? 'translate-x-2' : '-translate-x-2'}`} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="text-sm font-medium">Session Timeout (Minutes)</h4>
                        <p className="text-xs text-muted-foreground mt-1">Automatically log out users after a period of inactivity.</p>
                      </div>
                      <select value={formData.security?.sessionTimeout || '30'} onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))} className="rounded-md border border-slate-300 p-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="0">Never</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div>
                        <h4 className="text-sm font-medium">Password Expiry (Days)</h4>
                        <p className="text-xs text-muted-foreground mt-1">Force users to change their password periodically.</p>
                      </div>
                      <select value={formData.security?.passwordExpiryDays || '90'} onChange={(e) => handleInputChange('security', 'passwordExpiryDays', parseInt(e.target.value))} className="rounded-md border border-slate-300 p-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                        <option value="0">Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button 
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? "Saving..." : <><Save className="h-4 w-4" /> Save Settings</>}
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
