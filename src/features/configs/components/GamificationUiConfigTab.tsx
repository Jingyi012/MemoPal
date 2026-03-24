import React, { useEffect, useState } from "react";
import { Tabs, Space, Alert, Button, Drawer } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import GamificationUiPreview from "./GamificationUiPreview";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  type GamificationMobileUiConfig,
  GAMIFICATION_UI_CONFIG_DEFAULT,
  GAMIFICATION_UI_CONFIG_SCHEMA,
} from "../../../schemas/systemSettings";

/**
 * Gamification UI Configuration Editor
 * Allows admins to customize UI labels and display settings for the gamification system
 * Provides both form-based and advanced JSON editing modes with live preview
 */
export const GamificationUiConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig, refreshConfig } =
    useConfigEditor({
      configKey: "gamification.mobile.ui_config",
      defaultValue: GAMIFICATION_UI_CONFIG_DEFAULT as unknown as Record<
        string,
        unknown
      >,
    });

  const [previewOpen, setPreviewOpen] = useState(false);

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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Gamification UI Configuration</h3>
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={() => setPreviewOpen(true)}
        >
          Preview Mobile App
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: "form",
            label: "Form Editor",
            children: (
              <ConfigEditorForm
                schema={GAMIFICATION_UI_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Gamification UI Configuration"
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
                schema={GAMIFICATION_UI_CONFIG_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Gamification UI Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />

      <Drawer
        title="Mobile App Preview"
        placement="right"
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        width={500}
      >
        <GamificationUiPreview
          config={config as unknown as GamificationMobileUiConfig}
        />
      </Drawer>
    </Space>
  );
};

export default GamificationUiConfigTab;
