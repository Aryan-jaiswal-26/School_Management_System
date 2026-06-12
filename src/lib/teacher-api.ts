import { apiClient } from '@/lib/api-client';

export const fetchTeacherProfile = (id: string) =>
  apiClient<{ name: string; email: string; phone: string; bio: string; initials: string; sub: string }>(`/teacher/${id}`);

export const fetchLiveClassParticipants = (classId: string) =>
  apiClient<Array<{ id: number; name: string; status: string; hand?: boolean }>>(
    `/teacher/live-class/${classId}/participants`
  );

export const fetchExamInsights = (teacherId: string) =>
  apiClient<{ overall: any[]; examwise: any[]; subwise: any[] }>(`/teachers/${teacherId}/exams`);
