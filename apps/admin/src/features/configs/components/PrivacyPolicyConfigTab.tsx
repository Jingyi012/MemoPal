import React from "react";
import { Alert, Space, Tabs } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  PRIVACY_POLICY_CONFIG_DEFAULT,
  PRIVACY_POLICY_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

export const PrivacyPolicyConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: "support.privacy_policy",
    defaultValue: PRIVACY_POLICY_CONFIG_DEFAULT as unknown as Record<
      string,
      unknown
    >,
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await saveConfig(data);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          showIcon
          closable
        />
      )}

      <Alert
        type="info"
        message="Privacy Policy"
        description="Configure privacy policy title and sections shown in mobile settings."
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs
        items={[
          {
            key: "form",
            label: "Form Editor",
            children: (
              <ConfigEditorForm
                schema={PRIVACY_POLICY_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleSubmit}
                title="Privacy Policy Configuration"
                loading={isLoading}
              />
            ),
          },
          {
            key: "advanced",
            label: "Advanced (JSON)",
            children: (
              <AdvancedJsonEditor
                value={config}
                schema={PRIVACY_POLICY_CONFIG_SCHEMA}
                onSubmit={handleSubmit}
                title="Advanced Privacy Policy Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default PrivacyPolicyConfigTab;
