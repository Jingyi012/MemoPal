import { apiClient } from "../lib/apiClient";
import type { PaginatedResponse } from "../types/api";
import type { EducationCourseReportQueueItem } from "../types/educationCourseReports";

const endpoint = "/admin/education/course-reports";

export const educationCourseReportsApi = {
  async list(pageNumber = 1, pageSize = 20, status = "pending") {
    const { data } = await apiClient.get<PaginatedResponse<EducationCourseReportQueueItem>>(endpoint, {
      params: { pageNumber, pageSize, status },
    });
    return data;
  },
  async hide(courseId: string, reason: string) {
    await apiClient.patch(`${endpoint}/${encodeURIComponent(courseId)}/hide`, { reason });
  },
  async restore(courseId: string) {
    await apiClient.patch(`${endpoint}/${encodeURIComponent(courseId)}/restore`);
  },
  async setReportStatus(reportId: string, status: "resolved" | "dismissed", note: string) {
    await apiClient.patch(`${endpoint}/${encodeURIComponent(reportId)}/status`, { status, note });
  },
};
