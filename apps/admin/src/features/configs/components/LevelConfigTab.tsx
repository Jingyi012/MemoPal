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
        message="Level Progress"
        description="Set XP targets and level titles. Avatar companions are managed separately in Avatar Gallery, where each one can have its own artwork and unlock level."
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
                title="Level Progress"
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
                title="Advanced Level Progress"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
