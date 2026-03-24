import { PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import { Button } from "antd";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminUsersApi } from "../../../api/adminUsersApi";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import { adminPaths } from "../../../navigation/adminPaths";
import type { ManagedUserDto } from "../../../types/user";
import { buildUserColumns } from "../components/userColumns";
import { UserFormModal } from "../components/UserFormModal";
import { useUserMutations } from "../hooks/useUserMutations";

export default function UsersPage() {
  const navigate = useNavigate();
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
          (id) => navigate(adminPaths.userData(id)),
        )}
        headerTitle="User Management"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          const search = String(params.displayName || params.email || "");
          const page = await adminUsersApi.list(
            params.current || 1,
            params.pageSize || 20,
            search,
          );
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

