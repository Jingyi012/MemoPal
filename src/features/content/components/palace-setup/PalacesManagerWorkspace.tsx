import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button, Popconfirm, Tag } from "antd";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { PalaceDto } from "../../../../types/content";
import {
  useAdminContentApi,
  type ContentQueryScope,
  usePaginatedPalaces,
} from "../../hooks/useAdminContentApi";
import { ImageUploadField } from "../ImageUploadField";
import { MediaThumbnail } from "../MediaThumbnail";
import { buildPalacePayload, type PalaceFormValues } from "./forms";

interface PalacesManagerWorkspaceProps {
  onConfigure: (palaceId: string) => void;
  scope?: ContentQueryScope;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export function PalacesManagerWorkspace({
  onConfigure,
  scope,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
}: PalacesManagerWorkspaceProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const {
    createPalace,
    updatePalace,
    deletePalace,
  } = useAdminContentApi();
  const {
    pageNumber,
    pageSize,
    onTablePageChange,
    palacesQuery,
  } = usePaginatedPalaces({
    scope,
  });
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<PalaceDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const formLayout = {
    layout: "horizontal" as const,
    labelCol: { span: 7 },
    wrapperCol: { span: 17 },
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-content", "palaces"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-content-palaces"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createPalace,
    onSuccess: async () => {
      message.success("Palace created.");
      setCreateOpen(false);
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updatePalace>[1] }) =>
      updatePalace(args.id, args.payload),
    onSuccess: async () => {
      message.success("Palace updated.");
      setEditing(null);
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePalace,
    onSuccess: async () => {
      message.success("Palace deleted.");
      await refresh();
    },
  });

  const columns: ProColumns<PalaceDto>[] = useMemo(
    () => [
      { title: "Name", dataIndex: "name" },
      {
        title: "Description",
        dataIndex: "description",
        ellipsis: true,
      },
      {
        title: "Thumbnail",
        dataIndex: "thumbnail",
        width: 100,
        render: (_, row) => (
          <MediaThumbnail
            path={row.thumbnail}
            alt={`${row.name} thumbnail`}
            width={84}
            height={50}
          />
        ),
      },
      {
        title: "Locations",
        dataIndex: "locationsCount",
        align: "center",
        width: 100,
      },
      { title: "Unlock Level", dataIndex: "level", width: 100 },
      {
        title: "Premium",
        dataIndex: "isPremium",
        render: (_, row) => (
          <Tag color={row.isPremium ? "gold" : "default"}>
            {row.isPremium ? "Premium" : "No"}
          </Tag>
        ),
        width: 100,
      },
      {
        title: "Custom",
        dataIndex: "isCustom",
        render: (_, row) => (
          <Tag color={row.isCustom ? "blue" : "default"}>
            {row.isCustom ? "Custom" : "No"}
          </Tag>
        ),
        width: 100,
      },
      {
        title: "Actions",
        valueType: "option",
        render: (_, row) => {
          const actions: ReactNode[] = [
            <Button
              key="configure"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => onConfigure(row.id)}
            >
              Configure
            </Button>,
          ];

          if (allowEdit) {
            actions.push(
              <Button
                key="edit"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditing(row)}
              />,
            );
          }

          if (allowDelete) {
            actions.push(
              <Popconfirm
                key="delete"
                title="Delete this palace?"
                onConfirm={() => deleteMutation.mutate(row.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            );
          }

          return actions;
        },
      },
    ],
    [allowDelete, allowEdit, deleteMutation, onConfigure],
  );

  return (
    <>
      <ProTable<PalaceDto>
        rowKey="id"
        actionRef={actionRef}
        dataSource={palacesQuery.data?.data ?? []}
        loading={
          palacesQuery.isLoading ||
          palacesQuery.isFetching ||
          createMutation.isPending ||
          updateMutation.isPending ||
          deleteMutation.isPending
        }
        columns={columns}
        search={false}
        pagination={{
          current: pageNumber,
          pageSize,
          total: palacesQuery.data?.pagination.totalCount ?? 0,
          showSizeChanger: true,
          onChange: onTablePageChange,
        }}
        scroll={{ x: 800 }}
        toolBarRender={
          allowCreate
            ? () => [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateOpen(true)}
                >
                  New Palace
                </Button>,
              ]
            : false
        }
      />

      <ModalForm<PalaceFormValues>
        title="Create Palace"
        open={allowCreate && createOpen}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        onOpenChange={setCreateOpen}
        initialValues={{
          level: 1,
          isPremium: false,
          isCustom: false,
          isLocked: false,
        }}
        onFinish={async (values) => {
          await createMutation.mutateAsync(buildPalacePayload(values));
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="Name"
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter palace name" }}
        />
        <ProFormText
          name="description"
          label="Description"
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter short palace description" }}
        />
        <ProForm.Item
          name="thumbnail"
          label="Thumbnail"
          rules={[{ required: true }]}
        >
          <ImageUploadField category="palace" />
        </ProForm.Item>
        <ProFormDigit
          name="level"
          label="Unlock Level"
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter required user level" }}
        />
        <ProFormSwitch name="isPremium" label="Premium" />
        <ProFormSwitch name="isCustom" label="Custom" />
        <ProFormSwitch name="isLocked" label="Locked" />
      </ModalForm>

      <ModalForm<PalaceFormValues>
        key={editing?.id ?? "edit-palace"}
        title="Edit Palace"
        open={allowEdit && !!editing}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                thumbnail: editing.thumbnail,
                level: editing.level,
                isPremium: editing.isPremium,
                isCustom: editing.isCustom,
                isLocked: editing.isLocked,
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditing(null);
        }}
        onFinish={async (values) => {
          if (!editing) return false;
          await updateMutation.mutateAsync({
            id: editing.id,
            payload: buildPalacePayload(values, editing),
          });
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="Name"
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter palace name" }}
        />
        <ProFormText
          name="description"
          label="Description"
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter short palace description" }}
        />
        <ProForm.Item
          name="thumbnail"
          label="Thumbnail"
          rules={[{ required: true }]}
        >
          <ImageUploadField category="palace" />
        </ProForm.Item>
        <ProFormDigit
          name="level"
          label="Unlock Level"
          min={1}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: "Enter required user level" }}
        />
        <ProFormSwitch name="isPremium" label="Premium" />
        <ProFormSwitch name="isCustom" label="Custom" />
        <ProFormSwitch name="isLocked" label="Locked" />
      </ModalForm>
    </>
  );
}
