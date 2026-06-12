import { apiClient, API_BASE_URL, ApiError } from "@/lib/api-client";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new ApiError(payload?.message || response.statusText || "Request failed", response.status, payload);
  }

  return (payload?.data ?? payload) as T;
}

export async function fetchHomeworkItems() {
  return apiClient<any[]>("/homework");
}

export async function createHomeworkAssignment(data: any) {
  return apiClient<any>("/homework", {
    method: "POST",
    data,
  });
}

export async function submitHomeworkAssignment(homeworkId: string, remarks?: string, file?: File) {
  const formData = new FormData();
  if (remarks?.trim()) formData.append("remarks", remarks);
  if (file) formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/homework/${homeworkId}/submit`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseApiResponse<any>(response);
}

export async function gradeHomeworkSubmission(homeworkId: string, submissionId: string, score: number, feedback?: string) {
  return apiClient<any>(`/homework/${homeworkId}/submissions/${submissionId}/grade`, {
    method: "POST",
    data: { score, feedback }
  });
}

export async function fetchStudyMaterials() {
  return apiClient<any[]>("/homework/materials");
}

export async function uploadStudyMaterial(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/homework/materials`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseApiResponse<any>(response);
}
