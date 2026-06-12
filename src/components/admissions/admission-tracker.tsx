import { useState } from "react";
import {
  FileCheck,
  AlertCircle,
  Download,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";
import { BASE_URL } from "@/lib/api-client";
import { AdmissionApplication, DocumentVerification } from "@/lib/schemas";
import { AdmissionApplicationStatus } from "./admission-form";

interface AdmissionTrackingProps {
  application: AdmissionApplication;
  isAdmin?: boolean;
  onReview?: (status: string, notes: string) => void;
}

export function AdmissionApplicationTracker({
  application,
  isAdmin,
  onReview,
}: AdmissionTrackingProps) {
  const [expandedDocs, setExpandedDocs] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const getProgressPercentage = () => {
    const statusMap = {
      Draft: 20,
      Submitted: 40,
      "Under Review": 60,
      Approved: 100,
      Rejected: 0,
      Waitlisted: 50,
    };
    return statusMap[application.applicationStatus as keyof typeof statusMap] || 0;
  };

  const verifiedDocsCount = application.documents.filter(
    (d) => d.verificationStatus === "Verified",
  ).length;
  const allDocsCount = application.documents.length;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{application.studentName}</h2>
          <p className="text-sm text-muted-foreground">
            Application ID: <code className="text-xs font-mono">{application.id}</code>
          </p>
          <p className="mt-2 text-sm">
            Applying for:{" "}
            <span className="font-semibold">Grade {application.applyingForGrade}</span>
          </p>
        </div>
        <div className="text-right">
          <AdmissionApplicationStatus status={application.applicationStatus} />
          <p className="mt-2 text-xs text-muted-foreground">
            Applied on {new Date(application.appliedAt || "").toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Application Progress</span>
          <span className="text-muted-foreground">{getProgressPercentage()}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* APPLICATION TIMELINE */}
      <div className="space-y-3">
        <h3 className="font-semibold">Timeline</h3>
        <div className="space-y-3">
          {[
            {
              step: "Application Submitted",
              date: application.appliedAt,
              completed: !!application.appliedAt,
            },
            {
              step: "Under Review",
              date: application.reviewedAt,
              completed:
                application.applicationStatus !== "Draft" &&
                application.applicationStatus !== "Submitted",
            },
            {
              step: "Documents Verified",
              date: null,
              completed: verifiedDocsCount === allDocsCount,
            },
            {
              step: "Decision Made",
              date: application.reviewedAt,
              completed: ["Approved", "Rejected", "Waitlisted"].includes(
                application.applicationStatus,
              ),
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-1">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p
                  className={
                    item.completed ? "font-medium text-foreground" : "text-muted-foreground"
                  }
                >
                  {item.step}
                </p>
                {item.date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DOCUMENT VERIFICATION */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <button
          onClick={() => setExpandedDocs(!expandedDocs)}
          className="flex w-full items-center justify-between text-sm font-semibold hover:text-primary"
        >
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documents ({verifiedDocsCount}/{allDocsCount} verified)
          </div>
          <span className="text-xs text-muted-foreground">{expandedDocs ? "▼" : "▶"}</span>
        </button>

        {expandedDocs && (
          <div className="mt-4 space-y-2">
            {application.documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
            ) : (
              application.documents.map((doc) => (
                <DocumentVerificationStatus key={doc.id} document={doc} />
              ))
            )}
          </div>
        )}
      </div>

      {/* PERSONAL DETAILS */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">DATE OF BIRTH</p>
          <p className="text-sm font-semibold">
            {new Date(application.dateOfBirth).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">GENDER</p>
          <p className="text-sm font-semibold">{application.gender}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">EMAIL</p>
          <p className="text-sm font-semibold">{application.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">PHONE</p>
          <p className="text-sm font-semibold">{application.phone}</p>
        </div>
      </div>

      {/* ADMISSION FEE */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Admission Fee</p>
            <p className="text-xs text-muted-foreground">
              Status: {application.admissionFeeStatus}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">₹{application.admissionFeeAmount}</p>
            <button className="text-xs text-primary hover:underline">
              {application.admissionFeeStatus === "Pending" ? "Pay Now" : "View Receipt"}
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN SECTION */}
      {isAdmin && (
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="font-semibold">Admin Panel</h3>

          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add notes about this application..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onReview?.("Approved", adminNotes)}
              className="flex-1 rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onReview?.("Rejected", adminNotes)}
              className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              ✗ Reject
            </button>
            <button
              onClick={() => onReview?.("Waitlisted", adminNotes)}
              className="flex-1 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              ⏳ Waitlist
            </button>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-2 border-t border-border pt-6">
        <button className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <Download className="mr-2 inline h-4 w-4" />
          Download Application
        </button>
        {isAdmin && application.applicationStatus === "Approved" && (
          <button 
            onClick={() => {
              const token = localStorage.getItem("token") || sessionStorage.getItem("token");
              window.open(`${BASE_URL}/admissions/${application.id || application._id}/offer-letter?token=${token}`, '_blank');
            }}
            className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <FileText className="mr-2 inline h-4 w-4" />
            Offer Letter
          </button>
        )}
        <button className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          <MessageSquare className="mr-2 inline h-4 w-4" />
          Send Message
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function DocumentVerificationStatus({ document }: { document: DocumentVerification }) {
  const statusIcon = {
    Pending: <Clock className="h-4 w-4 text-yellow-500" />,
    Verified: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    Rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className="flex items-start justify-between rounded-md border border-border/50 p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {statusIcon[document.verificationStatus as keyof typeof statusIcon]}
        </div>
        <div>
          <p className="text-sm font-medium">{document.documentType}</p>
          <p className="text-xs text-muted-foreground">{document.fileName}</p>
          {document.remarks && (
            <p className="mt-1 text-xs text-muted-foreground italic">"{document.remarks}"</p>
          )}
        </div>
      </div>
      <button className="text-xs text-primary hover:underline">View</button>
    </div>
  );
}
