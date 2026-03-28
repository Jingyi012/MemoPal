import { Alert, Space, Tabs } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  LEVEL_CONFIGS_DEFAULT,
  LEVEL_CONFIGS_SCHEMA,
} from "../../../schemas/systemSettings";

export function LevelConfigTab() {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: "level.configs",
    defaultValue: LEVEL_CONFIGS_DEFAULT as unknown as Record<string, unknown>,
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
        message="Level Configurations"
        description="Configure level thresholds used to map total XP to player level."
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
                schema={LEVEL_CONFIGS_SCHEMA}
                formData={config}
                onSubmit={handleSubmit}
                title="Level Configurations"
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
                schema={LEVEL_CONFIGS_SCHEMA}
                onSubmit={handleSubmit}
                title="Advanced Level Configurations"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
