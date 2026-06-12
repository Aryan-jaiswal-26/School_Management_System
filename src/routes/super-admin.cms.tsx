import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect } from "react";
import { FileText, Save, HelpCircle, Plus, Edit2, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/cms")({
  component: SuperAdminCMS,
});

function SuperAdminCMS() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "faq">("terms");
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  const { data: cmsData, isLoading: isCmsLoading } = useQuery({
    queryKey: ['superAdmin', 'cms'],
    queryFn: SuperAdminAPI.getCMSContent
  });

  const { data: faqsData, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['superAdmin', 'faqs'],
    queryFn: SuperAdminAPI.getFAQs
  });

  useEffect(() => {
    if (cmsData?.data) {
      setTerms(cmsData.data.termsAndConditions || "");
      setPrivacy(cmsData.data.privacyPolicy || "");
    }
  }, [cmsData]);

  const updateCmsMutation = useMutation({
    mutationFn: (data: { type: string, content: string }) => SuperAdminAPI.updateCMSContent(data.type, data.content),
    onSuccess: () => {
      toast.success("Content updated successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'cms'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update content");
    }
  });

  const createFaqMutation = useMutation({
    mutationFn: SuperAdminAPI.createFAQ,
    onSuccess: () => {
      toast.success("FAQ created");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'faqs'] });
      setIsFaqModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create FAQ");
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => SuperAdminAPI.updateFAQ(id, data),
    onSuccess: () => {
      toast.success("FAQ updated");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'faqs'] });
      setIsFaqModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update FAQ");
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: SuperAdminAPI.deleteFAQ,
    onSuccess: () => {
      toast.success("FAQ deleted");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'faqs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete FAQ");
    }
  });

  const faqs = faqsData?.data || [];

  const handleSaveCms = () => {
    const type = activeTab === "terms" ? "terms" : "privacy";
    const content = activeTab === "terms" ? terms : privacy;

    if (!content || content.trim().length < 10) {
      toast.error("Content must be at least 10 characters long.");
      return;
    }
    updateCmsMutation.mutate({ type, content });
  };

  const handleSaveFaq = () => {
    const question = (document.getElementById('faq-question') as HTMLInputElement).value;
    const answer = (document.getElementById('faq-answer') as HTMLTextAreaElement).value;

    if (!question || question.trim().length < 5) {
      toast.error("Question must be at least 5 characters long.");
      return;
    }
    if (!answer || answer.trim().length < 5) {
      toast.error("Answer must be at least 5 characters long.");
      return;
    }

    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq._id, data: { question, answer } });
    } else {
      createFaqMutation.mutate({ question, answer, category: "General", isActive: true });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management (CMS)"
        description="Manage global platform content, legal policies, and help resources."
      />

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("terms")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "terms" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "privacy" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "faq" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          FAQ Management
        </button>
      </div>

      {(activeTab === "terms" || activeTab === "privacy") && (
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              {activeTab === "terms" ? "Edit Terms & Conditions" : "Edit Privacy Policy"}
            </h3>
            <button 
              onClick={handleSaveCms}
              disabled={updateCmsMutation.isPending || isCmsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {updateCmsMutation.isPending ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
          <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50">
            {/* Mock Rich Text Editor Container */}
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden">
              <div className="border-b border-slate-300 dark:border-slate-700 p-2 flex gap-2 bg-slate-100 dark:bg-slate-800">
                <select className="text-sm rounded border border-slate-300 px-2 py-1 dark:bg-slate-900 dark:border-slate-700"><option>Normal text</option><option>Heading 1</option></select>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold">B</button>
                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded italic">I</button>
                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded underline">U</button>
              </div>
              <textarea 
                className="flex-1 w-full p-4 resize-none outline-none dark:bg-slate-900"
                value={activeTab === "terms" ? terms : privacy}
                onChange={(e) => activeTab === "terms" ? setTerms(e.target.value) : setPrivacy(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "faq" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-slate-500" />
              Frequently Asked Questions
            </h3>
            <button 
              onClick={() => { setEditingFaq(null); setIsFaqModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add FAQ
            </button>
          </div>
          <div className="divide-y divide-border">
            {isFaqsLoading && <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>}
            {!isFaqsLoading && faqs.length === 0 && <div className="p-8 text-center text-slate-500">No FAQs found.</div>}
            {faqs.map((faq: any) => (
              <div key={faq._id} className="p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{faq.question}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{faq.answer}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingFaq(faq); setIsFaqModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this FAQ?')) {
                        deleteFaqMutation.mutate(faq._id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              <button onClick={() => setIsFaqModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <input id="faq-question" type="text" defaultValue={editingFaq?.question} className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700" placeholder="e.g. How to reset password?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea id="faq-answer" defaultValue={editingFaq?.answer} rows={4} className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700 resize-none" placeholder="Enter the answer here..."></textarea>
              </div>
              <button 
                onClick={handleSaveFaq} 
                disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                className="w-full bg-indigo-600 text-white rounded-md p-2 mt-4 disabled:opacity-50"
              >
                {(createFaqMutation.isPending || updateFaqMutation.isPending) ? "Saving..." : "Save FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
