import { apiClient } from "./api-client";

export interface Quiz {
  _id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  teacherId?: any;
  classId?: any;
  // Student specific
  hasResponded?: boolean;
  selectedOptionIndex?: number | null;
  correctOptionIndex?: number | null;
}

export interface QuizResult {
  quiz: Quiz;
  responses: Array<{
    _id: string;
    studentId: { _id: string; firstName: string; lastName: string; admissionNumber: string };
    selectedOptionIndex: number;
    createdAt: string;
  }>;
}

export async function createQuiz(payload: { classId: string; question: string; options: string[]; correctOptionIndex: number }) {
  return apiClient<Quiz>("/quizzes", {
    method: "POST",
    data: payload,
  });
}

export async function getTeacherQuizzes() {
  return apiClient<Quiz[]>("/quizzes/teacher");
}

export async function getQuizResults(quizId: string) {
  return apiClient<QuizResult>(`/quizzes/${quizId}/results`);
}

export async function getStudentQuizzes() {
  return apiClient<Quiz[]>("/quizzes/student");
}

export async function submitQuizResponse(quizId: string, selectedOptionIndex: number) {
  return apiClient<{ correctOptionIndex: number; selectedOptionIndex: number }>(`/quizzes/${quizId}/respond`, {
    method: "POST",
    data: { selectedOptionIndex },
  });
}
