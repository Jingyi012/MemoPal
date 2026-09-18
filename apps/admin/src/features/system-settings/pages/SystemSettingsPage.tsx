import AiConfigTab from "../../configs/components/AiConfigTab";
import { ModalForm, ProFormText, ProTable } from "@ant-design/pro-components";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { App, Button, Grid, Tabs } from "antd";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PortalPageContainer } from "../../../components/PortalPageContainer";
import type {
  SystemSettingDto,
  UpsertSystemSettingRequest,
} from "../../../types/systemSetting";
import FeatureLimitsConfigTab from "../../configs/components/FeatureLimitsConfigTab";
import ReferralProgramConfigTab from "../../configs/components/ReferralProgramConfigTab";
import AuthLoginMethodsConfigTab from "../../configs/components/AuthLoginMethodsConfigTab";
import HelpFaqConfigTab from "../../configs/components/HelpFaqConfigTab";
import PrivacyPolicyConfigTab from "../../configs/components/PrivacyPolicyConfigTab";
import PremiumSubscriptionConfigTab from "../../configs/components/PremiumSubscriptionConfigTab";
import NumberPegDefinitionsConfigTab from "../../configs/components/NumberPegDefinitionsConfigTab";
import { useAdminSystemSettingsApi } from "../hooks/useAdminSystemSettingsApi";

const SYSTEM_SETTINGS_SECTIONS = [
  "feature-limits",
  "referral-program",
  "auth-login-methods",
  "help-faq",
  "privacy-policy",
  "premium-subscription",
  "number-peg-definitions",
  "ai",
  "advanced",
] as const;

type SystemSettingsSection = (typeof SYSTEM_SETTINGS_SECTIONS)[number];

export default function SystemSettingsPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const { listSystemSettings, upsertSystemSetting } = useAdminSystemSettingsApi();
  const actionRef = useRef<ActionType | null>(null);
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedSection = searchParams.get("section");
  const activeSection = SYSTEM_SETTINGS_SECTIONS.includes(
    requestedSection as SystemSettingsSection,
  )
    ? (requestedSection as SystemSettingsSection)
    : SYSTEM_SETTINGS_SECTIONS[0];

  const handleSectionChange = (section: string) => {
    if (!SYSTEM_SETTINGS_SECTIONS.includes(section as SystemSettingsSection)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", section);
    setSearchParams(nextParams, { replace: true });
  };

  const upsertMutation = useMutation({
    mutationFn: upsertSystemSetting,
    onSuccess: () => {
      message.success("Setting saved");
      setOpen(false);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<SystemSettingDto>[] = [
    { title: "Key", dataIndex: "key" },
    { title: "Value", dataIndex: "value", render: (_, record) => record.key.startsWith("ai.") ? "Manage in AI Configuration" : record.value },
    { title: "Description", dataIndex: "description" },
    { title: "Updated", dataIndex: "updatedAt", valueType: "dateTime" },
  ];

  return (
    <PortalPageContainer title="System settings" description="Manage the app experience, service configuration and membership rules." eyebrow="Administration">
      <Tabs
        activeKey={activeSection}
        onChange={handleSectionChange}
        className="portal-settings-tabs"
        tabPosition={screens.lg ? "left" : "top"}
        tabBarStyle={{
          backgroundColor: "white",
          borderRadius: 12,
        }}
        items={[
          { key: "ai", label: "AI Configuration", children: <AiConfigTab /> },
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
            key: "help-faq",
            label: "Help & FAQ",
            children: <HelpFaqConfigTab />,
          },
          {
            key: "privacy-policy",
            label: "Privacy Policy",
            children: <PrivacyPolicyConfigTab />,
          },
          {
            key: "premium-subscription",
            label: "Premium Subscription",
            children: <PremiumSubscriptionConfigTab />,
          },
          {
            key: "number-peg-definitions",
            label: "Number Peg Definitions",
            children: <NumberPegDefinitionsConfigTab />,
          },
          {
            key: "advanced",
            label: "Advanced (All Settings)",
            children: (
              <>
                <ProTable<SystemSettingDto>
        scroll={{ x: 960 }}
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
                    const pageNumber = params.current || 1;
                    const pageSize = params.pageSize || 20;
                    const key = String(params.key || "");
                    const data = await queryClient.fetchQuery({
                      queryKey: [
                        "admin-system-settings",
                        "list",
                        pageNumber,
                        pageSize,
                        key,
                      ],
                      queryFn: () => listSystemSettings(pageNumber, pageSize, key),
                    });
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
                        "Enter setting key (e.g., feature.limits)",
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
