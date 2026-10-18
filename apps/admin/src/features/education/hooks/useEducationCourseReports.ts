import { App } from "antd";
import { useMutation } from "@tanstack/react-query";
import { educationCourseReportsApi } from "../../../api/educationCourseReportsApi";
import { extractApiErrorMessage } from "../../../lib/errorMessage";

export function useEducationCourseReports() {
  const { message } = App.useApp();
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, "Could not complete the request."));
  const hide = useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason: string }) => educationCourseReportsApi.hide(courseId, reason),
    onSuccess: () => message.success("Course hidden from public learning."),
    onError,
    meta: { suppressGlobalErrorToast: true },
    retry: false,
  });
  const restore = useMutation({
    mutationFn: educationCourseReportsApi.restore,
    onSuccess: () => message.success("Course restored to public learning."),
    onError,
    meta: { suppressGlobalErrorToast: true },
    retry: false,
  });
  const setReportStatus = useMutation({
    mutationFn: ({ reportId, status, note }: { reportId: string; status: "resolved" | "dismissed"; note: string }) =>
      educationCourseReportsApi.setReportStatus(reportId, status, note),
    onSuccess: () => message.success("Report decision saved."),
    onError,
    meta: { suppressGlobalErrorToast: true },
    retry: false,
  });
  return { hide, restore, setReportStatus };
}
