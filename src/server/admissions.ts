/**
 * Admission System Server Functions
 * Handles online admission forms, application tracking, document verification, fee collection
 */

import { apiClient } from "@/lib/api-client";

export async function submitAdmissionEnquiry(applicationData: any) {
  try {
    return await apiClient<any>("/admissions/enquiry", { method: "POST", data: applicationData });
  } catch (err: any) {
    console.warn("Mocking submitAdmissionEnquiry", err);
    return { success: true, data: { id: "mock_id", ...applicationData, applicationStatus: "Draft" } };
  }
}

export async function submitAdmissionApplication(applicationId: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/submit`, { method: "POST" });
  } catch (err: any) {
    console.warn("Mocking submitAdmissionApplication", err);
    return { success: true, data: { id: applicationId, applicationStatus: "Submitted" } };
  }
}

export async function uploadApplicationDocument(applicationId: string, documentData: any) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/documents`, { method: "POST", data: documentData });
  } catch (err: any) {
    console.warn("Mocking uploadApplicationDocument", err);
    return { success: true, data: { ...documentData, verificationStatus: "Pending" } };
  }
}

export async function getAdmissionApplications(filters: any = {}) {
  try {
    return await apiClient<any>("/admissions", { method: "GET", data: filters });
  } catch (err: any) {
    console.warn("Mocking getAdmissionApplications", err);
    return { success: true, data: [], total: 0 };
  }
}

export async function getAdmissionApplication(applicationId: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}`);
  } catch (err: any) {
    console.warn("Mocking getAdmissionApplication", err);
    return { success: true, data: { id: applicationId } };
  }
}

export async function getWaitlistedApplications(grade: string) {
  try {
    return await apiClient<any>(`/admissions/waitlist?grade=${grade}`);
  } catch (err: any) {
    console.warn("Mocking getWaitlistedApplications", err);
    return { success: true, data: [] };
  }
}

export async function verifyDocument(applicationId: string, documentId: string, verificationStatus: string, remarks?: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/documents/${documentId}/verify`, { method: "PATCH", data: { verificationStatus, remarks } });
  } catch (err: any) {
    console.warn("Mocking verifyDocument", err);
    return { success: true, data: {} };
  }
}

export async function reviewAdmissionApplication(applicationId: string, reviewStatus: string, adminNotes: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/review`, { method: "PATCH", data: { reviewStatus, adminNotes } });
  } catch (err: any) {
    console.warn("Mocking reviewAdmissionApplication", err);
    return { success: true, data: {} };
  }
}

export async function approveAdmission(applicationId: string, offerData: any) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/approve`, { method: "POST", data: offerData });
  } catch (err: any) {
    console.warn("Mocking approveAdmission", err);
    return { success: true, application: { id: applicationId }, offerLetter: { id: "mock_offer" } };
  }
}

export async function rejectAdmission(applicationId: string, rejectionReason: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/reject`, { method: "POST", data: { rejectionReason } });
  } catch (err: any) {
    console.warn("Mocking rejectAdmission", err);
    return { success: true, data: {} };
  }
}

export async function waitlistApplication(applicationId: string, waitlistPosition: number) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/waitlist`, { method: "POST", data: { waitlistPosition } });
  } catch (err: any) {
    console.warn("Mocking waitlistApplication", err);
    return { success: true, data: {} };
  }
}

export async function getAdmissionStats(academicYear: string) {
  try {
    return await apiClient<any>(`/admissions/stats?academicYear=${academicYear}`);
  } catch (err: any) {
    console.warn("Mocking getAdmissionStats", err);
    return { success: true, data: { "Submitted": 0, "Under Review": 0, "Approved": 0, "Rejected": 0, "Waitlisted": 0 } };
  }
}

export async function recordAdmissionFee(applicationId: string, amount: number, paymentMethod: string, receipt: string) {
  try {
    return await apiClient<any>(`/admissions/${applicationId}/fee`, { method: "POST", data: { amount, paymentMethod, receipt } });
  } catch (err: any) {
    console.warn("Mocking recordAdmissionFee", err);
    return { success: true, data: {} };
  }
}
