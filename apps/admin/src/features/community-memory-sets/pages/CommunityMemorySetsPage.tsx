import { EyeInvisibleOutlined, EyeOutlined, FileSearchOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Empty, Input, List, Modal, Select, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { adminCommunityMemorySetsApi } from "../../../api/adminCommunityMemorySetsApi";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type {
  CommunityMemorySetView,
  CommunityMemorySetStatus,
} from "../../../types/communityMemorySet";
import {
  adminCommunityMemorySetsQueryKey,
  useAdminCommunityMemorySets,
} from "../hooks/useAdminCommunityMemorySets";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function CommunityMemorySetsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<CommunityMemorySetStatus | undefined>();
  const [selected, setSelected] = useState<CommunityMemorySetView | null>(null);
  const [hideTarget, setHideTarget] = useState<CommunityMemorySetView | null>(null);
  const [hideReason, setHideReason] = useState("");
  const { hideMutation, restoreMutation } = useAdminCommunityMemorySets();

  const columns = useMemo<ProColumns<CommunityMemorySetView>[]>(
    () => [
      {
        title: "Memory set",
        dataIndex: "title",
        width: 240,
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{row.title}</Typography.Text>
            <Typography.Text type="secondary" ellipsis={{ tooltip: row.description ?? undefined }}>
              {row.description || "No description"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Author",
        dataIndex: "author",
        width: 160,
        search: false,
        render: (_, row) => row.author.displayName || "Unknown author",
      },
      { title: "Technique", dataIndex: "techniqueKey", search: false, width: 120 },
      { title: "Items", dataIndex: "itemCount", search: false, width: 76 },
      { title: "Copies", dataIndex: "copyCount", search: false, width: 76 },
      {
        title: "Reports",
        dataIndex: "reportCount",
        search: false,
        width: 92,
        render: (value, row) => (
          <Tag color={row.reportCount > 0 ? "orange" : "default"}>{value}</Tag>
        ),
      },
      {
        title: "Published",
        dataIndex: "publishedAt",
        search: false,
        width: 170,
        render: (_, row) => formatDateTime(row.publishedAt),
      },
      {
        title: "Status",
        dataIndex: "communityStatus",
        search: false,
        width: 105,
        render: (_, row) => (
          <Tag color={row.communityStatus === "hidden" ? "red" : "green"}>
            {row.communityStatus === "hidden" ? "Hidden" : "Visible"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        search: false,
        fixed: "right",
        width: 210,
        render: (_, row) =>
          <Space>
            <Button size="small" icon={<FileSearchOutlined />} onClick={() => setSelected(row)}>
              Review
            </Button>
            {row.communityStatus === "hidden" ? (
            <Button
              size="small"
              icon={<EyeOutlined />}
              loading={restoreMutation.isPending && restoreMutation.variables === row.id}
              onClick={() => restoreMutation.mutate(row.id)}
            >
              Restore
            </Button>
            ) : (
              <Button size="small" danger icon={<EyeInvisibleOutlined />}
                loading={hideMutation.isPending && hideMutation.variables?.id === row.id}
                onClick={() => { setHideTarget(row); setHideReason(""); }}>
                Hide
              </Button>
            )}
          </Space>,
      },
    ],
    [hideMutation, restoreMutation],
  );

  return (
    <PortalPageContainer title="Community moderation" description="Review shared memory sets and reports, and manage their visibility." eyebrow="Community">
      <ProTable<CommunityMemorySetView>
        scroll={{ x: 1260 }}
        rowKey="id"
        key={status ?? "all"}
        headerTitle="Community Memory Sets"
        columns={columns}
        search={{ labelWidth: "auto" }}
        options={false}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        toolBarRender={() => [
          <Select
            key="status"
            allowClear
            placeholder="All statuses"
            value={status}
            onChange={setStatus}
            options={[
              { label: "Visible", value: "visible" },
              { label: "Hidden", value: "hidden" },
            ]}
            style={{ width: 150 }}
          />,
        ]}
        request={async (params) => {
          const search = String(params.title || params.author || "");
          const pageNumber = Number(params.current || 1);
          const pageSize = Number(params.pageSize || 20);
          const page = await queryClient.fetchQuery({
            queryKey: [...adminCommunityMemorySetsQueryKey, pageNumber, pageSize, search, status],
            queryFn: () => adminCommunityMemorySetsApi.list({ pageNumber, pageSize, search, status }),
          });
          return { data: page.data, success: page.success, total: page.pagination.totalCount };
        }}
      />

      <Drawer
        title={selected ? `Review: ${selected.title}` : "Review memory set"}
        width={560}
        open={!!selected}
        onClose={() => setSelected(null)}
        extra={selected?.communityStatus === "visible" ? (
          <Button danger icon={<EyeInvisibleOutlined />} onClick={() => {
            setHideTarget(selected);
            setHideReason("");
          }}>Hide content</Button>
        ) : undefined}
      >
        {selected ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Paragraph>{selected.description || "No description provided."}</Typography.Paragraph>
            <Descriptions column={1} bordered size="small" items={[
              { key: "author", label: "Author", children: selected.author.displayName },
              { key: "technique", label: "Technique", children: selected.techniqueKey },
              { key: "published", label: "Published", children: formatDateTime(selected.publishedAt) },
              { key: "status", label: "Status", children: selected.communityStatus },
              ...(selected.hiddenReason ? [{ key: "hiddenReason", label: "Hidden reason", children: selected.hiddenReason }] : []),
            ]} />
            <div>
              <Typography.Title level={5}>Reports ({selected.reports.length})</Typography.Title>
              {selected.reports.length ? (
                <List dataSource={selected.reports} renderItem={(report) => (
                  <List.Item>
                    <List.Item.Meta title={<Space><Tag color="orange">{report.reason}</Tag><Typography.Text type="secondary">{formatDateTime(report.createdAt)}</Typography.Text></Space>}
                      description={report.details || "No additional details."} />
                  </List.Item>
                )} />
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No reports" />}
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Hide community memory set"
        open={!!hideTarget}
        okText="Hide content"
        okButtonProps={{ danger: true, disabled: !hideReason.trim(), loading: hideMutation.isPending }}
        onCancel={() => setHideTarget(null)}
        onOk={async () => {
          if (!hideTarget || !hideReason.trim()) return;
          await hideMutation.mutateAsync({ id: hideTarget.id, reason: hideReason.trim() });
          setHideTarget(null);
          setSelected(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          This removes the content from the community library. Record a reason for the moderation history.
        </Typography.Paragraph>
        <Input.TextArea rows={4} maxLength={500} showCount value={hideReason}
          placeholder="Reason for hiding this content" onChange={(event) => setHideReason(event.target.value)} />
      </Modal>
    </PortalPageContainer>
  );
}
