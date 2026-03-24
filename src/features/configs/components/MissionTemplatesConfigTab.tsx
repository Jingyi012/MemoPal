import React, { useEffect } from "react";
import { Tabs, Space, Alert } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  MISSION_TEMPLATES_CONFIG_DEFAULT,
  MISSION_TEMPLATES_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

/**
 * Mission Templates Configuration Editor
 * Allows admins to create, edit, and manage mission templates
 */
export const MissionTemplatesConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig, refreshConfig } =
    useConfigEditor({
      configKey: "gamification.missions.templates",
      defaultValue: MISSION_TEMPLATES_CONFIG_DEFAULT as unknown as Record<
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
        message="Mission Templates"
        description="Define missions that will be available to users. Each mission has a metric type, period, and reward value."
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
                schema={MISSION_TEMPLATES_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Mission Templates Configuration"
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
                schema={MISSION_TEMPLATES_CONFIG_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Mission Templates Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default MissionTemplatesConfigTab;
