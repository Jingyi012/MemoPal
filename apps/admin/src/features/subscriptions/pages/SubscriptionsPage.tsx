import { EditOutlined } from "@ant-design/icons";
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormSwitch,
  ProTable,
} from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button } from "antd";
import { useRef, useState } from "react";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import { useSubscriptionsApi } from "../hooks/useSubscriptionsApi";
import type { UserSubscriptionView, UpdateSubscriptionRequest } from "../../../types/subscription";

export default function SubscriptionsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { listSubscriptions, updateSubscription } = useSubscriptionsApi();
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<UserSubscriptionView | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubscriptionRequest }) =>
      updateSubscription(id, payload),
    onSuccess: () => {
      message.success("Subscription updated");
      setEditing(null);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<UserSubscriptionView>[] = [
    {
      title: "User",
      dataIndex: "userEmail",
      render: (_, row) => row.userDisplayName ? `${row.userDisplayName} (${row.userEmail})` : row.userEmail || row.userId,
    },
    { title: "Plan", dataIndex: "planId", search: false },
    { title: "Provider", dataIndex: "provider", search: false },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        active: { text: "Active", status: "Success" },
        canceled: { text: "Canceled", status: "Default" },
        past_due: { text: "Past due", status: "Error" },
        trialing: { text: "Trial", status: "Processing" },
      },
    },
    { title: "Expires", dataIndex: "expiresAt", search: false, valueType: "dateTime" },
    { title: "Auto renew", dataIndex: "autoRenew", search: false, valueType: "switch" },
    {
      title: "Actions",
      valueType: "option",
      render: (_, row) => [
        <Button
          key="edit"
          aria-label="Edit subscription"
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditing(row)}
        />,
      ],
    },
  ];

  return (
    <PortalPageContainer title="Subscriptions" description="Review member plans, subscription status and renewal settings." eyebrow="Billing">
      <ProTable<UserSubscriptionView>
        scroll={{ x: 800 }}
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        headerTitle="Memberships"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          const pageNumber = params.current || 1;
          const pageSize = params.pageSize || 20;
          const search = String(params.userEmail || "");
          const status = String(params.status || "");
          const data = await queryClient.fetchQuery({
            queryKey: [
              "admin-subscriptions",
              "list",
              pageNumber,
              pageSize,
              search,
              status,
            ],
            queryFn: () => listSubscriptions(pageNumber, pageSize, search, status),
          });
          return {
            data: data.data,
            success: data.success,
            total: data.pagination.totalCount,
          };
        }}
      />

      <ModalForm
        key={editing?.id ?? "edit-subscription"}
        title="Update Subscription"
        open={!!editing}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ? { ...editing } : undefined}
        onOpenChange={(open) => !open && setEditing(null)}
        onFinish={async (values) => {
          if (!editing) return false;
          await updateMutation.mutateAsync({ id: editing.id, payload: values });
          return true;
        }}
      >
        <ProFormSelect
          name="status"
          label="Status"
          placeholder="Select subscription status"
          options={[
            { label: "active", value: "active" },
            { label: "canceled", value: "canceled" },
            { label: "past_due", value: "past_due" },
            { label: "trialing", value: "trialing" },
          ]}
        />
        <ProFormDateTimePicker
          name="expiresAt"
          label="Expires At"
          fieldProps={{ placeholder: "Select expiration date/time" }}
        />
        <ProFormDateTimePicker
          name="lastVerifiedAt"
          label="Last Verified At"
          fieldProps={{ placeholder: "Select last verification date/time" }}
        />
        <ProFormSwitch name="autoRenew" label="Auto Renew" />
      </ModalForm>
    </PortalPageContainer>
  );
}
