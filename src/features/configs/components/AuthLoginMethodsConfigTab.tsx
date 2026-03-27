import React, { useEffect } from "react";
import { Tabs, Space, Alert } from "antd";
import AdvancedJsonEditor from "../../../components/AdvancedJsonEditor";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { useConfigEditor } from "../../../hooks/useConfigEditor";
import {
  AUTH_LOGIN_METHODS_DEFAULT,
  AUTH_LOGIN_METHODS_SCHEMA,
} from "../../../schemas/systemSettings";

export const AuthLoginMethodsConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig, refreshConfig } =
    useConfigEditor({
      configKey: "auth.login_methods",
      defaultValue: AUTH_LOGIN_METHODS_DEFAULT as unknown as Record<
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

  const handleAdvancedSubmit = async (data: Record<string, unknown>) => {
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
        message="Authentication Login Methods"
        description="Enable or disable email/password, Google, and Facebook login methods for all clients."
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
                schema={AUTH_LOGIN_METHODS_SCHEMA}
                formData={config}
                onSubmit={handleFormSubmit}
                title="Authentication Login Methods"
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
                schema={AUTH_LOGIN_METHODS_SCHEMA}
                onSubmit={handleAdvancedSubmit}
                title="Advanced Authentication Login Methods"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default AuthLoginMethodsConfigTab;
