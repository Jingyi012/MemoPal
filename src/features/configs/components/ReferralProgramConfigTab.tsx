import React, { useEffect } from "react";
import { Tabs, Space, Alert } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  REFERRAL_PROGRAM_CONFIG_DEFAULT,
  REFERRAL_PROGRAM_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

/**
 * Referral Program Configuration Editor
 * Allows admins to configure referral rewards, tiers, and program settings
 */
export const ReferralProgramConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig, refreshConfig } =
    useConfigEditor({
      configKey: "growth.referral.program_config",
      defaultValue: REFERRAL_PROGRAM_CONFIG_DEFAULT as unknown as Record<
        string,
        unknown
      >,
    });

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

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
        message="Referral Program Configuration"
        description="Configure referral rewards, bonus per tier, and reward tiers. Enable/disable the program as needed."
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
                schema={REFERRAL_PROGRAM_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Referral Program Configuration"
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
                schema={REFERRAL_PROGRAM_CONFIG_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Referral Program Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default ReferralProgramConfigTab;
