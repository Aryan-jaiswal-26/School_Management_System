import { apiClient } from './api-client';

// ----- Dashboard (children list + overview) -----
export async function fetchParentDashboard() {
  const { data } = await apiClient('/parents/dashboard');
  return data;
}

export async function fetchParentProfile() {
  const { data } = await apiClient('/parents/profile');
  return data;
}

// ----- Academic data per student -----
export async function fetchStudentAcademics(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/academics`);
  return data;
}

// ----- Homework diary per student -----
export async function fetchStudentHomework(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/homework`);
  return data;
}

export async function fetchChildAttendance(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/attendance`);
  return data;
}

// Alias used by parent.academics for attendance calendar
export const fetchStudentAttendance = fetchChildAttendance;


// ----- Report cards per student -----
export async function fetchStudentReportCards(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/report-cards`);
  return data;
}

// ----- Transport info per student -----
export async function fetchStudentTransport(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/transport`);
  return data;
}

// ----- PTM meetings -----
export async function fetchPtmMeetings(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/ptm`);
  return data;
}

export async function createPtmMeeting(studentId: string, payload: Record<string, string>) {
  const { data } = await apiClient(`/parents/children/${studentId}/ptm`, {
    method: 'POST',
    data: payload,
  });
  return data;
}

export async function fetchChildContacts(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/contacts`);
  return data;
}

export async function fetchChildLeaves(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/leaves`);
  return data;
}

export async function submitChildLeave(studentId: string, payload: Record<string, unknown>) {
  const { data } = await apiClient(`/parents/children/${studentId}/leaves`, {
    method: 'POST',
    data: payload,
  });
  return data;
}

export async function fetchChildCanteen(studentId: string) {
  const { data } = await apiClient(`/parents/children/${studentId}/canteen`);
  return data;
}

export async function fetchNotificationPreferences() {
  const { data } = await apiClient('/parents/preferences');
  return data;
}

export async function updateNotificationPreferences(payload: Record<string, unknown>) {
  const { data } = await apiClient('/parents/preferences', { method: 'PUT', data: payload });
  return data;
}

export async function fetchCommunityPosts() {
  const { data } = await apiClient('/parents/community/posts');
  return data;
}

export async function createCommunityPost(payload: Record<string, unknown>) {
  const { data } = await apiClient('/parents/community/posts', { method: 'POST', data: payload });
  return data;
}

export async function fetchParentFeedback() {
  const { data } = await apiClient('/parents/feedback');
  return data;
}

export async function submitParentFeedback(payload: Record<string, unknown>) {
  const { data } = await apiClient('/parents/feedback', { method: 'POST', data: payload });
  return data;
}

// ----- Notifications / announcements -----
export async function fetchAnnouncements() {
  const { data } = await apiClient('/notifications/announcements');
  return data;
}
