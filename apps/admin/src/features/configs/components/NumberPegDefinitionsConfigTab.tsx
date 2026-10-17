import { Alert, Space, Tabs } from 'antd';
import AdvancedJsonEditor from '../../../components/AdvancedJsonEditor';
import ConfigEditorForm from '../../../components/ConfigEditorForm';
import { useConfigEditor } from '../../../hooks/useConfigEditor';
import {
  NUMBER_PEG_DEFINITIONS_DEFAULT,
  NUMBER_PEG_DEFINITIONS_SCHEMA,
} from '../../../schemas/systemSettings';

export default function NumberPegDefinitionsConfigTab() {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: 'number-peg.definitions',
    defaultValue: NUMBER_PEG_DEFINITIONS_DEFAULT as unknown as Record<string, unknown>,
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {error ? <Alert type="error" message="Error" description={error} showIcon closable /> : null}
      <Alert
        type="info"
        message="Number Peg Definitions"
        description="Edit the name, icon, description, and unlock level used by the 1–100 Number Peg anchors in the mobile app. Anchors unlock in number order."
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Tabs
        items={[
          {
            key: 'form',
            label: 'Form Editor',
            children: (
              <ConfigEditorForm
                schema={NUMBER_PEG_DEFINITIONS_SCHEMA}
                formData={config}
                onSubmit={saveConfig}
                title="Number Peg Definitions"
                loading={isLoading}
              />
            ),
          },
          {
            key: 'advanced',
            label: 'Advanced (JSON)',
            children: (
              <AdvancedJsonEditor
                value={config}
                schema={NUMBER_PEG_DEFINITIONS_SCHEMA}
                onSubmit={saveConfig}
                title="Advanced Number Peg Definitions"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
}
