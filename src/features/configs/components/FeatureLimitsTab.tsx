import { ProForm, ProFormDigit } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Alert, Card, message } from 'antd';
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
      <Alert
        showIcon
        type='info'
        style={{ marginBottom: 16 }}
        message='Configure free and premium plan limits centrally. Backend enforces these limits when users create custom content.'
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
        <ProFormDigit
          name='freeCustomPalaces'
          label='Free: Custom Palaces'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 0' }}
        />
        <ProFormDigit
          name='premiumCustomPalaces'
          label='Premium: Custom Palaces'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 20' }}
        />
        <ProFormDigit
          name='freeCustomLessonsPerPalace'
          label='Free: Lessons Per Palace'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 5' }}
        />
        <ProFormDigit
          name='premiumCustomLessonsPerPalace'
          label='Premium: Lessons Per Palace'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 50' }}
        />
        <ProFormDigit
          name='freeCustomLocationsPerPalace'
          label='Free: Locations Per Palace'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 15' }}
        />
        <ProFormDigit
          name='premiumCustomLocationsPerPalace'
          label='Premium: Locations Per Palace'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 100' }}
        />
        <ProFormDigit
          name='freeCustomWordsPerLesson'
          label='Free: Words Per Lesson'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 25' }}
        />
        <ProFormDigit
          name='premiumCustomWordsPerLesson'
          label='Premium: Words Per Lesson'
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'e.g. 200' }}
        />
      </ProForm>
    </Card>
  );
}
