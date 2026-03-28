import React from "react";
import { Tabs, Space, Alert } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  FEATURE_LIMITS_DEFAULT,
  FEATURE_LIMITS_SCHEMA,
} from "../../../schemas/systemSettings";

/**
 * Feature Limits Configuration Editor
 * Allows admins to set resource limits for free and premium users
 */
export const FeatureLimitsTab: React.FC = () => {
  const { config, isLoading, error, saveConfig } =
    useConfigEditor({
      configKey: "feature_limits",
      defaultValue: FEATURE_LIMITS_DEFAULT as unknown as Record<
        string,
        unknown
      >,
    });

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    await saveConfig(data);
  };

  const handleAdvancedSubmit = async (data: any) => {
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
        message="Feature Limits"
        description="Configure the maximum resources allowed for free and premium users. Changes apply immediately."
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
                schema={FEATURE_LIMITS_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Feature Limits Configuration"
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
                schema={FEATURE_LIMITS_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Feature Limits Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default FeatureLimitsTab;
