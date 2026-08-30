import React from "react";
import { Alert, Space, Tabs } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  HELP_FAQ_CONFIG_DEFAULT,
  HELP_FAQ_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

export const HelpFaqConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: "support.help_faq",
    defaultValue: HELP_FAQ_CONFIG_DEFAULT as unknown as Record<string, unknown>,
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
        message="Help & FAQ"
        description="Configure FAQ entries and whether email support should be shown in mobile settings."
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
                schema={HELP_FAQ_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleSubmit}
                title="Help & FAQ Configuration"
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
                schema={HELP_FAQ_CONFIG_SCHEMA}
                onSubmit={handleSubmit}
                title="Advanced Help & FAQ Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default HelpFaqConfigTab;
