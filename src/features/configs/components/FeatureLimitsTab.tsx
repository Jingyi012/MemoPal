import { ProForm, ProFormDigit } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Alert, Card, Col, Divider, Row, Space, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { adminSystemSettingsApi } from '../../../api/adminSystemSettingsApi';

type LimitFormValues = {
  freeCustomPalaces: number;
  premiumCustomPalaces: number;
  freeCustomLessonsPerPalace: number;
  premiumCustomLessonsPerPalace: number;
  freeCustomLocationsPerPalace: number;
  premiumCustomLocationsPerPalace: number;
  freeCustomWordsPerLesson: number;
  premiumCustomWordsPerLesson: number;
};

const DEFAULT_LIMITS: LimitFormValues = {
  freeCustomPalaces: 0,
  premiumCustomPalaces: 20,
  freeCustomLessonsPerPalace: 5,
  premiumCustomLessonsPerPalace: 50,
  freeCustomLocationsPerPalace: 15,
  premiumCustomLocationsPerPalace: 100,
  freeCustomWordsPerLesson: 25,
  premiumCustomWordsPerLesson: 200,
};

function parseLimit(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const LIMIT_SETTINGS: Array<{
  key: string;
  field: keyof LimitFormValues;
  description: string;
}> = [
  {
    key: 'limits.custom_palaces.free',
    field: 'freeCustomPalaces',
    description: 'Maximum number of custom palaces allowed for free users.',
  },
  {
    key: 'limits.custom_palaces.premium',
    field: 'premiumCustomPalaces',
    description: 'Maximum number of custom palaces allowed for premium users.',
  },
  {
    key: 'limits.custom_lessons_per_palace.free',
    field: 'freeCustomLessonsPerPalace',
    description: 'Maximum custom lessons allowed per palace for free users.',
  },
  {
    key: 'limits.custom_lessons_per_palace.premium',
    field: 'premiumCustomLessonsPerPalace',
    description: 'Maximum custom lessons allowed per palace for premium users.',
  },
  {
    key: 'limits.custom_locations_per_palace.free',
    field: 'freeCustomLocationsPerPalace',
    description: 'Maximum custom locations allowed per palace for free users.',
  },
  {
    key: 'limits.custom_locations_per_palace.premium',
    field: 'premiumCustomLocationsPerPalace',
    description: 'Maximum custom locations allowed per palace for premium users.',
  },
  {
    key: 'limits.custom_words_per_lesson.free',
    field: 'freeCustomWordsPerLesson',
    description: 'Maximum custom words allowed per lesson for free users.',
  },
  {
    key: 'limits.custom_words_per_lesson.premium',
    field: 'premiumCustomWordsPerLesson',
    description: 'Maximum custom words allowed per lesson for premium users.',
  },
];

const LIMIT_GROUPS: Array<{
  id: string;
  title: string;
  description: string;
  freeField: keyof LimitFormValues;
  premiumField: keyof LimitFormValues;
  freePlaceholder: string;
  premiumPlaceholder: string;
  unitLabel: string;
}> = [
  {
    id: 'palaces',
    title: 'Custom Palaces',
    description: 'Maximum number of custom palaces a user can create.',
    freeField: 'freeCustomPalaces',
    premiumField: 'premiumCustomPalaces',
    freePlaceholder: 'e.g. 0',
    premiumPlaceholder: 'e.g. 20',
    unitLabel: 'palaces',
  },
  {
    id: 'lessons',
    title: 'Lessons Per Palace',
    description: 'Maximum custom lessons allowed in each custom palace.',
    freeField: 'freeCustomLessonsPerPalace',
    premiumField: 'premiumCustomLessonsPerPalace',
    freePlaceholder: 'e.g. 5',
    premiumPlaceholder: 'e.g. 50',
    unitLabel: 'lessons',
  },
  {
    id: 'locations',
    title: 'Locations Per Palace',
    description: 'Maximum locations allowed in each custom palace.',
    freeField: 'freeCustomLocationsPerPalace',
    premiumField: 'premiumCustomLocationsPerPalace',
    freePlaceholder: 'e.g. 15',
    premiumPlaceholder: 'e.g. 100',
    unitLabel: 'locations',
  },
  {
    id: 'words',
    title: 'Words Per Lesson',
    description: 'Maximum words allowed in each custom lesson.',
    freeField: 'freeCustomWordsPerLesson',
    premiumField: 'premiumCustomWordsPerLesson',
    freePlaceholder: 'e.g. 25',
    premiumPlaceholder: 'e.g. 200',
    unitLabel: 'words',
  },
];

export function FeatureLimitsTab() {
  const [initialValues, setInitialValues] = useState<LimitFormValues>(DEFAULT_LIMITS);
  const [loading, setLoading] = useState(true);

  const loadLimits = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminSystemSettingsApi.list(1, 100, 'limits.custom_');
      const settings = new Map(result.data.map((item) => [item.key, item.value]));

      const nextValues = { ...DEFAULT_LIMITS };
      for (const item of LIMIT_SETTINGS) {
        const fallback = DEFAULT_LIMITS[item.field];
        nextValues[item.field] = parseLimit(settings.get(item.key), fallback);
      }
      setInitialValues(nextValues);
    } catch {
      message.error('Failed to load feature limits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLimits();
  }, [loadLimits]);

  const upsertMutation = useMutation({
    mutationFn: async (values: LimitFormValues) => {
      await Promise.all(
        LIMIT_SETTINGS.map((item) =>
          adminSystemSettingsApi.upsert({
            key: item.key,
            value: String(values[item.field]),
            description: item.description,
          })
        )
      );
    },
    onSuccess: () => {
      message.success('Feature limits updated.');
      void loadLimits();
    },
    onError: () => {
      message.error('Failed to update feature limits.');
    },
  });

  return (
    <Card loading={loading}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Alert
          showIcon
          type='info'
          message='Plan limits are enforced by backend API during content creation.'
          description='Set values for each capability below. Use 0 if a plan should not access that capability.'
        />
        <Alert
          showIcon
          type='success'
          message='Recommended strategy'
          description='Keep free limits sufficient for trial value and use premium limits to expand depth (not just unlock everything).'
        />

        <ProForm<LimitFormValues>
          key={JSON.stringify(initialValues)}
          initialValues={initialValues}
          submitter={{
            searchConfig: {
              submitText: 'Save Limits',
              resetText: 'Reload',
            },
            resetButtonProps: {
              disabled: upsertMutation.isPending,
            },
            submitButtonProps: {
              loading: upsertMutation.isPending,
            },
          }}
          onReset={() => {
            void loadLimits();
          }}
          onFinish={async (values) => {
            await upsertMutation.mutateAsync(values);
            return true;
          }}
        >
          <Row gutter={[16, 16]}>
            {LIMIT_GROUPS.map((group) => (
              <Col xs={24} lg={12} key={group.id}>
                <Card
                  size='small'
                  title={group.title}
                  extra={<Tag color='blue'>{group.unitLabel}</Tag>}
                  styles={{ body: { paddingBottom: 8 } }}
                >
                  <Typography.Text type='secondary'>{group.description}</Typography.Text>
                  <Divider style={{ margin: '12px 0' }} />
                  <Row gutter={12}>
                    <Col span={12}>
                      <ProFormDigit
                        name={group.freeField}
                        label='Free Plan'
                        min={0}
                        rules={[{ required: true }]}
                        fieldProps={{ placeholder: group.freePlaceholder }}
                      />
                    </Col>
                    <Col span={12}>
                      <ProFormDigit
                        name={group.premiumField}
                        label='Premium Plan'
                        min={0}
                        rules={[{ required: true }]}
                        fieldProps={{ placeholder: group.premiumPlaceholder }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </ProForm>
      </Space>
    </Card>
  );
}
