import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Switch } from "antd";
import { useRef, useState } from "react";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type { ManagedUserDto } from "../../../types/user";
import { buildUserColumns } from "../components/userColumns";
import { UserFormModal } from "../components/UserFormModal";
import { useAdminUsersApi } from "../hooks/useAdminUsersApi";
import { useUserMutations } from "../hooks/useUserMutations";
import { useAuth } from "../../../auth/AuthContext";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { listUsers } = useAdminUsersApi();
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<ManagedUserDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const refresh = () => actionRef.current?.reload();
  const { createMutation, updateMutation, deleteMutation, restoreMutation } =
    useUserMutations(refresh);

  return (
    <PortalPageContainer title="Users" description="Manage accounts, roles and access across MemoPal." eyebrow="People"
      actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>New user</Button>}
    >
      <ProTable<ManagedUserDto>
        scroll={{ x: 840 }}
        key={includeDeleted ? "all-users" : "active-users"}
        rowKey="id"
        actionRef={actionRef}
        columns={buildUserColumns(
          (row) => setEditing(row),
          (id) => deleteMutation.mutate(id),
          (id) => restoreMutation.mutate(id),
          user?.id,
        )}
        headerTitle="User directory"
        search={{ labelWidth: "auto", collapseRender: false, defaultCollapsed: false }}
        request={async (params) => {
          const search = String(params.search || "");
          const pageNumber = params.current || 1;
          const pageSize = params.pageSize || 20;
          const page = await queryClient.fetchQuery({
            queryKey: ["admin-users", "list", pageNumber, pageSize, search, includeDeleted],
            queryFn: () => listUsers(pageNumber, pageSize, search, includeDeleted),
          });
          return {
            data: page.data,
            success: page.success,
            total: page.pagination.totalCount,
          };
        }}
        toolBarRender={() => [
          <Switch key="deleted" checked={includeDeleted} checkedChildren="Including deactivated" unCheckedChildren="Active only" onChange={setIncludeDeleted} />,

        ]}
      />

      <UserFormModal
        title="Create User"
        open={createOpen}
        formKey="create-user"
        requirePassword
        initialValues={{ role: "User", level: 1, totalXp: 0 }}
        onOpenChange={setCreateOpen}
        onFinish={async (values) => {
          await createMutation.mutateAsync(values);
          setCreateOpen(false);
          return true;
        }}
      />

      <UserFormModal
        title="Edit User"
        open={!!editing}
        formKey={editing?.id ?? 'edit-user'}
        roleDisabled={editing?.id === user?.id}
        initialValues={editing ? { ...editing } : undefined}
        onOpenChange={(open) => !open && setEditing(null)}
        onFinish={async (values) => {
          if (!editing) return false;
          await updateMutation.mutateAsync({ id: editing.id, payload: values });
          setEditing(null);
          return true;
        }}
      />
    </PortalPageContainer>
  );
}
