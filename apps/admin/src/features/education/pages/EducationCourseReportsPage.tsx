import { EyeInvisibleOutlined, EyeOutlined, FileSearchOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Descriptions, Drawer, Empty, Input, List, Modal, Select, Space, Tag, Typography } from "antd";
import { useMemo, useRef, useState } from "react";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import { educationCourseReportsApi } from "../../../api/educationCourseReportsApi";
import type { EducationCourseReportQueueItem, EducationCourseReportStatus } from "../../../types/educationCourseReports";
import { useEducationCourseReports } from "../hooks/useEducationCourseReports";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function EducationCourseReportsPage() {
  const { hide, restore, setReportStatus } = useEducationCourseReports();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [selected, setSelected] = useState<EducationCourseReportQueueItem | null>(null);
  const [hideTarget, setHideTarget] = useState<EducationCourseReportQueueItem | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<EducationCourseReportStatus | "all">("pending");
  const [decisionTarget, setDecisionTarget] = useState<{ reportId: string; status: "resolved" | "dismissed" } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const columns = useMemo<ProColumns<EducationCourseReportQueueItem>[]>(() => [
    { title: "Learning resource", dataIndex: "title", render: (_, row) => <Typography.Text strong>{row.title}</Typography.Text> },
    { title: "Author", dataIndex: "authorDisplayName", search: false },
    { title: "Reports", dataIndex: "reportCount", search: false, width: 100, render: (value) => <Tag color="orange">{value}</Tag> },
    { title: "Visibility", dataIndex: "isModerationHidden", search: false, width: 120, render: (_, row) => row.isModerationHidden ? <Tag color="red">Hidden</Tag> : <Tag color={row.isPublic ? "green" : "default"}>{row.isPublic ? "Public" : "Unpublished"}</Tag> },
    { title: "Latest report", dataIndex: "reports", search: false, render: (_, row) => formatDate(row.reports[0]?.createdAt) },
    { title: "Actions", key: "actions", search: false, width: 210, render: (_, row) => <Space>
      <Button size="small" icon={<FileSearchOutlined />} onClick={() => setSelected(row)}>Review</Button>
      {row.isModerationHidden
        ? <Button size="small" icon={<EyeOutlined />} loading={restore.isPending && restore.variables === row.courseId} onClick={() => restore.mutate(row.courseId, { onSuccess: () => void actionRef.current?.reload() })}>Restore</Button>
        : <Button size="small" danger icon={<EyeInvisibleOutlined />} onClick={() => { setHideTarget(row); setReason(""); }}>Hide</Button>}
    </Space> },
  ], [restore]);

  return <PortalPageContainer title="Public learning reports" description="Review learner reports and remove or restore public courses." eyebrow="Education moderation">
    <ProTable<EducationCourseReportQueueItem>
      key={status} actionRef={actionRef} rowKey="courseId" columns={columns} search={false} options={false} pagination={{ pageSize: 20 }}
      request={async params => {
        const page = await educationCourseReportsApi.list(Number(params.current || 1), Number(params.pageSize || 20), status);
        return { data: page.data, success: page.success, total: page.pagination.totalCount };
      }}
      locale={{ emptyText: <Empty description="No course reports" /> }}
      toolBarRender={() => [
        <Select key="status" value={status} onChange={value => setStatus(value)} style={{ width: 150 }} options={[
          { label: "Pending", value: "pending" }, { label: "Resolved", value: "resolved" },
          { label: "Dismissed", value: "dismissed" }, { label: "All reports", value: "all" },
        ]} />,
        <Button key="refresh" onClick={() => void actionRef.current?.reload()}>Refresh</Button>,
      ]}
    />
    <Drawer title={selected ? `Review: ${selected.title}` : "Review course"} width={560} open={!!selected} onClose={() => setSelected(null)}>
      {selected ? <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Descriptions bordered size="small" column={1} items={[
          { key: "author", label: "Author", children: selected.authorDisplayName },
          { key: "visibility", label: "Visibility", children: selected.isModerationHidden ? "Hidden by moderation" : selected.isPublic ? "Public" : "Unpublished" },
          ...(selected.moderationHiddenReason ? [{ key: "reason", label: "Moderation reason", children: selected.moderationHiddenReason }] : []),
        ]} />
        <div><Typography.Title level={5}>Reports ({selected.reports.length})</Typography.Title>
          {selected.reports.length ? <List dataSource={selected.reports} renderItem={report => <List.Item actions={report.status === "pending" ? [
            <Button key="resolve" size="small" onClick={() => { setDecisionTarget({ reportId: report.id, status: "resolved" }); setDecisionNote(""); }}>Resolve</Button>,
            <Button key="dismiss" size="small" danger onClick={() => { setDecisionTarget({ reportId: report.id, status: "dismissed" }); setDecisionNote(""); }}>Dismiss</Button>,
          ] : undefined}><List.Item.Meta
            title={<Space><Tag color="orange">{report.reason}</Tag><Tag color={report.status === "pending" ? "gold" : report.status === "resolved" ? "green" : "default"}>{report.status}</Tag><Typography.Text type="secondary">{formatDate(report.createdAt)}</Typography.Text></Space>}
            description={<Space direction="vertical"><span>{report.details || "No additional details."}</span>{report.resolutionNote ? <Typography.Text type="secondary">Decision: {report.resolutionNote} · {formatDate(report.resolvedAtUtc)}</Typography.Text> : null}</Space>} />
          </List.Item>} /> : <Empty description="No reports" />}</div>
      </Space> : null}
    </Drawer>
    <Modal title="Hide public learning resource" open={!!hideTarget} okText="Hide course" okButtonProps={{ danger: true, disabled: !reason.trim(), loading: hide.isPending }}
      onCancel={() => setHideTarget(null)} onOk={async () => { if (!hideTarget || !reason.trim()) return; await hide.mutateAsync({ courseId: hideTarget.courseId, reason: reason.trim() }); setHideTarget(null); setSelected(null); await actionRef.current?.reload(); }}>
      <Typography.Paragraph type="secondary">The course and its public practice will be hidden immediately. Record a reason for the moderation history.</Typography.Paragraph>
      <Input.TextArea rows={4} maxLength={500} showCount value={reason} onChange={event => setReason(event.target.value)} placeholder="Reason for hiding this course" />
    </Modal>
    <Modal title={decisionTarget?.status === "resolved" ? "Resolve report" : "Dismiss report"} open={!!decisionTarget}
      okText={decisionTarget?.status === "resolved" ? "Mark resolved" : "Dismiss report"}
      okButtonProps={{ disabled: !decisionNote.trim(), loading: setReportStatus.isPending }}
      onCancel={() => setDecisionTarget(null)} onOk={async () => {
        if (!decisionTarget || !decisionNote.trim()) return;
        await setReportStatus.mutateAsync({ ...decisionTarget, note: decisionNote.trim() });
        setDecisionTarget(null);
        setSelected(null);
        await actionRef.current?.reload();
      }}>
      <Typography.Paragraph type="secondary">Add a short internal note. The report will remain available in the resolved or dismissed filter.</Typography.Paragraph>
      <Input.TextArea rows={4} maxLength={500} showCount value={decisionNote} onChange={event => setDecisionNote(event.target.value)} placeholder="Decision note" />
    </Modal>
  </PortalPageContainer>;
}
