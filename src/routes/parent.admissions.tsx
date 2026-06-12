import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdmissionEnquiryForm } from "@/components/admissions/admission-form";
import { AdmissionApplicationTracker } from "@/components/admissions/admission-tracker";
import { PageHeader, Panel } from "@/components/module-shell";
import { AdmissionApplication } from "@/lib/schemas";

export const Route = createFileRoute("/parent/admissions")({
  component: ParentAdmissionsPage,
});

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

function ParentAdmissionsPage() {
  const [view, setView] = useState<"list" | "details" | "new">("list");
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  const fetchApplications = async () => {
    try {
      const res = await apiClient<any>("/admissions/my-applications");
      setApplications(res?.data || []);
    } catch (err) {
      toast.error("Failed to load applications");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDetails = (app: AdmissionApplication) => {
    setSelectedApp(app);
    setActiveChild(app.id);
    setView("details");
  };

  return (
    <div>
      {view === "list" && (
        <>
          <PageHeader
            title="Admission Status"
            subtitle="Track your children's admission applications"
            actions={
              <button
                onClick={() => setView("new")}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                New Application
              </button>
            }
          />

          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold">Your Applications</h2>

            {applications.length === 0 ? (
              <Panel className="text-center">
                <p className="text-sm text-muted-foreground">No applications yet</p>
                <button
                  onClick={() => setView("new")}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create New Application
                </button>
              </Panel>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <Panel
                    key={app._id || app.id}
                    className="cursor-pointer transition hover:border-primary/50"
                    onClick={() => handleViewDetails(app)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{app.studentName}</h3>
                          <span className="text-xs font-medium text-muted-foreground">
                            ({app.gender === "Male" ? "Son" : "Daughter"})
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Applying for Grade {app.applyingForGrade}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Applied: {new Date(app.appliedAt || "").toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <StatusBadge status={app.applicationStatus} />
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Documents:{" "}
                            {
                              app.documents.filter((d) => d.verificationStatus === "Verified")
                                .length
                            }
                            /{app.documents.length}
                          </p>
                          {app.admissionFeeStatus === "Pending" && (
                            <p className="mt-1 text-xs text-orange-600">
                              Fee: ₹{app.admissionFeeAmount} pending
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === "details" && selectedApp && (
        <>
          <button
            onClick={() => setView("list")}
            className="mb-4 text-sm font-medium text-primary hover:underline"
          >
            ← Back to Applications
          </button>
          <AdmissionApplicationTracker application={selectedApp} isAdmin={false} />

          {selectedApp.admissionFeeStatus === "Pending" && (
            <Panel className="mt-6 border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900">Admission Fee Payment Due</h3>
                  <p className="text-sm text-orange-800">
                    Please complete the admission fee payment to confirm admission
                  </p>
                </div>
                <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                  Pay ₹{selectedApp.admissionFeeAmount}
                </button>
              </div>
            </Panel>
          )}

          {selectedApp.applicationStatus === "Approved" &&
            selectedApp.admissionFeeStatus === "Paid" && (
              <Panel className="mt-6 border-green-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">✓ Admission Confirmed!</h3>
                    <p className="text-sm text-green-800">
                      Congratulations! Your admission has been confirmed. Welcome to our school!
                    </p>
                  </div>
                  <button className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50">
                    Download Confirmation
                  </button>
                </div>
              </Panel>
            )}
        </>
      )}

      {view === "new" && (
        <>
          <button
            onClick={() => setView("list")}
            className="mb-4 text-sm font-medium text-primary hover:underline"
          >
            ← Back
          </button>
          <Panel>
            <h2 className="mb-4 text-lg font-semibold">New Admission Application</h2>
            <AdmissionEnquiryForm onSuccess={() => setView("list")} />
          </Panel>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    Draft: { bg: "bg-gray-100", text: "text-gray-700", icon: "✏️" },
    Submitted: { bg: "bg-blue-100", text: "text-blue-700", icon: "📨" },
    "Under Review": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "👀" },
    Approved: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    Rejected: { bg: "bg-red-100", text: "text-red-700", icon: "❌" },
    Waitlisted: { bg: "bg-orange-100", text: "text-orange-700", icon: "⏳" },
  };

  const config = statusConfig[status] || statusConfig.Draft;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span>{config.icon}</span>
      {status}
    </div>
  );
}
