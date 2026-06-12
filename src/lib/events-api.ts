import { apiClient } from './api-client';

// ─── Events ──────────────────────────────────────────────────────────────────
export async function fetchEvents() {
  const res = await apiClient<any>('/events');
  return res ?? [];
}

export async function createEvent(payload: any) {
  return apiClient<any>('/events', { method: 'POST', body: JSON.stringify(payload) });
}

export async function rsvpEvent(id: string) {
  return apiClient<any>(`/events/${id}/rsvp`, { method: 'POST', body: '{}' });
}

export async function volunteerEvent(id: string, volunteerName: string) {
  return apiClient<any>(`/events/${id}/volunteer`, { method: 'POST', body: JSON.stringify({ volunteerName }) });
}

export async function uploadGalleryPhoto(id: string, photoUrl: string) {
  return apiClient<any>(`/events/${id}/gallery`, { method: 'POST', body: JSON.stringify({ photoUrl }) });
}

// ─── Birthdays ────────────────────────────────────────────────────────────────
export async function fetchTodaysBirthdays() {
  const res = await apiClient<any>('/birthdays/today');
  return (res as any) ?? { students: [], staff: [] };
}

// ─── Elections ────────────────────────────────────────────────────────────────
export async function fetchElections() {
  const res = await apiClient<any[]>('/elections');
  return res ?? [];
}

export async function createElection(payload: any) {
  return apiClient<any>('/elections', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchCandidates(electionId: string) {
  const res = await apiClient<any[]>(`/elections/${electionId}/candidates`);
  return res ?? [];
}

export async function addCandidate(electionId: string, payload: any) {
  return apiClient<any>(`/elections/${electionId}/candidates`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function castVote(electionId: string, candidateId: string) {
  return apiClient<any>(`/elections/${electionId}/vote`, { method: 'POST', body: JSON.stringify({ candidateId }) });
}

// ─── Newsletters ──────────────────────────────────────────────────────────────
export async function fetchNewsletters() {
  const res = await apiClient<any[]>('/newsletters');
  return res ?? [];
}

export async function createNewsletter(payload: any) {
  return apiClient<any>('/newsletters', { method: 'POST', body: JSON.stringify(payload) });
}
