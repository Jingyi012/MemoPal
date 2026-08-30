import { Alert, Space, Tabs } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  XP_CONFIGS_DEFAULT,
  XP_CONFIGS_SCHEMA,
} from "../../../schemas/systemSettings";

export function XpConfigTab() {
  const { config, isLoading, error, saveConfig } =
    useConfigEditor({
      configKey: "xp.configs",
      defaultValue: XP_CONFIGS_DEFAULT as unknown as Record<string, unknown>,
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
        message="Simple XP Rewards"
        description="Users earn XP for learning a memory, completing a due review, or doing limited extra practice. The API calculates every award; mobile clients cannot choose an amount."
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
                schema={XP_CONFIGS_SCHEMA}
                formData={config}
                onSubmit={handleSubmit}
                title="Simple XP Rewards"
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
                schema={XP_CONFIGS_SCHEMA}
                onSubmit={handleSubmit}
                title="Advanced XP Rewards"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
