import React from 'react';
import { Alert, Space, Tabs } from 'antd';
import AdvancedJsonEditor from '../../../components/AdvancedJsonEditor';
import ConfigEditorForm from '../../../components/ConfigEditorForm';
import { useConfigEditor } from '../../../hooks/useConfigEditor';
import {
  PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT,
  PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA,
} from '../../../schemas/systemSettings';

export const PremiumSubscriptionConfigTab: React.FC = () => {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: 'premium.subscription',
    defaultValue: PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT as unknown as Record<string, unknown>,
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await saveConfig(data);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {error && <Alert type="error" message="Error" description={error} showIcon closable />}

      <Alert
        type="info"
        message="Premium Subscription"
        description="Configure premium page content, monthly AI credit allowance, plans, terms, and whether the subscription CTA is enabled. The allowance applies every month to both monthly and yearly subscribers."
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
                schema={PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA}
                formData={config}
                onSubmit={handleSubmit}
                title="Premium Subscription Configuration"
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
                schema={PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA}
                onSubmit={handleSubmit}
                title="Advanced Premium Subscription Configuration"
                loading={isLoading}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

export default PremiumSubscriptionConfigTab;
