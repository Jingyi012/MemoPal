import React from 'react';
import { Alert, Space, Tabs } from 'antd';
import AdvancedJsonEditor from '../../../components/AdvancedJsonEditor';
import ConfigEditorForm from '../../../components/ConfigEditorForm';
import { useConfigEditor } from '../../../hooks/useConfigEditor';
import {
  PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT,
  PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA,
} from '../../../schemas/systemSettings';

const createSectionSchema = (
  title: string,
  description: string,
  keys: string[],
) => {
  const schema = PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA as Record<string, any>;

  return {
    type: 'object',
    title,
    description,
    properties: Object.fromEntries(
      keys.map((key) => [key, schema.properties[key]]),
    ),
    required: keys,
    additionalProperties: false,
  };
};

const PREMIUM_SUBSCRIPTION_FORM_SECTIONS = [
  {
    key: 'overview',
    label: 'Overview & CTA',
    title: 'Overview and subscription button',
    description: 'Manage the premium page headline, monthly credits, and call-to-action copy.',
    keys: ['monthlyAiCredits', 'hero', 'sections', 'subscribeButton', 'footer'],
  },
  {
    key: 'plans',
    label: 'Plans',
    title: 'Subscription plans',
    description: 'Add and arrange the plans shown to members on the premium page.',
    keys: ['plans'],
  },
  {
    key: 'features',
    label: 'Features',
    title: 'Included features',
    description: 'Define the benefits and the order in which they appear.',
    keys: ['features'],
  },
  {
    key: 'terms',
    label: 'Terms',
    title: 'Terms and conditions',
    description: 'Edit the labels and sections displayed in the terms sheet.',
    keys: ['terms'],
  },
].map((section) => ({
  ...section,
  schema: createSectionSchema(section.title, section.description, section.keys),
}));

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
              <Tabs
                type="card"
                items={PREMIUM_SUBSCRIPTION_FORM_SECTIONS.map((section) => ({
                  key: section.key,
                  label: section.label,
                  children: (
                    <ConfigEditorForm
                      schema={section.schema}
                      formData={config}
                      onSubmit={(data) => handleSubmit({ ...config, ...data })}
                      title={section.title}
                      loading={isLoading}
                      arrayItemLayout="comfortable"
                    />
                  ),
                }))}
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
