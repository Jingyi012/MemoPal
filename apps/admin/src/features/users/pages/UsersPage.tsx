import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import { useRef, useState } from "react";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type { ManagedUserDto } from "../../../types/user";
import { buildUserColumns } from "../components/userColumns";
import { UserFormModal } from "../components/UserFormModal";
import { useAdminUsersApi } from "../hooks/useAdminUsersApi";
import { useUserMutations } from "../hooks/useUserMutations";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { listUsers } = useAdminUsersApi();
  const actionRef = useRef<ActionType | null>(null);
  const [editing, setEditing] = useState<ManagedUserDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = () => actionRef.current?.reload();
  const { createMutation, updateMutation, deleteMutation } =
    useUserMutations(refresh);

  return (
    <PortalPageContainer>
      <ProTable<ManagedUserDto>
        rowKey="id"
        actionRef={actionRef}
        columns={buildUserColumns(
          (row) => setEditing(row),
          (id) => deleteMutation.mutate(id),
        )}
        headerTitle="User Management"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          const search = String(params.displayName || params.email || "");
          const pageNumber = params.current || 1;
          const pageSize = params.pageSize || 20;
          const page = await queryClient.fetchQuery({
            queryKey: ["admin-users", "list", pageNumber, pageSize, search],
            queryFn: () => listUsers(pageNumber, pageSize, search),
          });
          return {
            data: page.data,
            success: page.success,
            total: page.pagination.totalCount,
          };
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            key="add"
          >
            New User
          </Button>,
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
