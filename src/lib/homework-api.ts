import { apiClient } from "@/lib/api-client";

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
  return apiClient<any>(`/homework/${homeworkId}/submit`, {
    method: "POST",
    data: { remarks, fileName: file?.name },
  });
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
  return apiClient<any>("/homework/materials", {
    method: "POST",
    data: {
      title: formData.get("title"),
      description: formData.get("description"),
      fileName: (formData.get("file") as File | null)?.name,
    },
  });
}
