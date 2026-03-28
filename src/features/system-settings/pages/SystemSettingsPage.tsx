import { ModalForm, ProFormText, ProTable } from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { useMutation } from "@tanstack/react-query";
import { App, Button, Tabs } from "antd";
import { useRef, useState } from "react";
import { adminSystemSettingsApi } from "../../../api/adminSystemSettingsApi";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type {
  SystemSettingDto,
  UpsertSystemSettingRequest,
} from "../../../types/systemSetting";
import GamificationUiConfigTab from "../../configs/components/GamificationUiConfigTab";
import FeatureLimitsConfigTab from "../../configs/components/FeatureLimitsConfigTab";
import ReferralProgramConfigTab from "../../configs/components/ReferralProgramConfigTab";
import AuthLoginMethodsConfigTab from "../../configs/components/AuthLoginMethodsConfigTab";

export default function SystemSettingsPage() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [open, setOpen] = useState(false);

  const upsertMutation = useMutation({
    mutationFn: adminSystemSettingsApi.upsert,
    onSuccess: () => {
      message.success("Setting saved");
      setOpen(false);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<SystemSettingDto>[] = [
    { title: "Key", dataIndex: "key" },
    { title: "Value", dataIndex: "value" },
    { title: "Description", dataIndex: "description" },
    { title: "Updated", dataIndex: "updatedAt", valueType: "dateTime" },
  ];

  return (
    <PortalPageContainer>
      <Tabs
        tabPosition="left"
        tabBarStyle={{
          backgroundColor: "white",
          borderRadius: 12,
        }}
        items={[
          {
            key: "gamification",
            label: "Gamification UI",
            children: <GamificationUiConfigTab />,
          },
          {
            key: "feature-limits",
            label: "Feature Limits",
            children: <FeatureLimitsConfigTab />,
          },
          {
            key: "referral-program",
            label: "Referral Program",
            children: <ReferralProgramConfigTab />,
          },
          {
            key: "auth-login-methods",
            label: "Auth Login Methods",
            children: <AuthLoginMethodsConfigTab />,
          },
          {
            key: "advanced",
            label: "Advanced (All Settings)",
            children: (
              <>
                <ProTable<SystemSettingDto>
                  rowKey="id"
                  actionRef={actionRef}
                  columns={columns}
                  toolBarRender={() => [
                    <Button
                      key="add"
                      type="primary"
                      onClick={() => setOpen(true)}
                    >
                      Add / Update
                    </Button>,
                  ]}
                  request={async (params) => {
                    const data = await adminSystemSettingsApi.list(
                      params.current || 1,
                      params.pageSize || 20,
                      String(params.key || ""),
                    );
                    return {
                      data: data.data,
                      success: data.success,
                      total: data.pagination.totalCount,
                    };
                  }}
                />

                <ModalForm<UpsertSystemSettingRequest>
                  title="Upsert System Setting"
                  open={open}
                  modalProps={{ destroyOnClose: true }}
                  onOpenChange={setOpen}
                  onFinish={async (values) => {
                    await upsertMutation.mutateAsync(values);
                    return true;
                  }}
                >
                  <ProFormText
                    name="key"
                    label="Key"
                    rules={[{ required: true }]}
                    fieldProps={{
                      placeholder:
                        "Enter setting key (e.g., limits.custom_palaces.free)",
                    }}
                  />
                  <ProFormText
                    name="value"
                    label="Value"
                    rules={[{ required: true }]}
                    fieldProps={{ placeholder: "Enter setting value" }}
                  />
                  <ProFormText
                    name="description"
                    label="Description"
                    fieldProps={{
                      placeholder: "Enter setting description (optional)",
                    }}
                  />
                </ModalForm>
              </>
            ),
          },
        ]}
      />
    </PortalPageContainer>
  );
}
