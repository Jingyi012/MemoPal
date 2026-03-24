import React, { useEffect, useState } from "react";
import { Card, Col, Divider, Row, Space, Tag, Typography, message } from "antd";
import { useMutation } from "@tanstack/react-query";
import { ProForm, ProFormDigit } from "@ant-design/pro-components";
import { adminSystemSettingsApi } from "../../../api/adminSystemSettingsApi";

interface FormValues {
  customPalacesFree: number;
  customPalacesPremium: number;
  customLessonsPerPalaceFree: number;
  customLessonsPerPalacePremium: number;
  customLocationsPerPalaceFree: number;
  customLocationsPerPalacePremium: number;
  customWordsPerLessonFree: number;
  customWordsPerLessonPremium: number;
}

const DEFAULT_VALUES: FormValues = {
  customPalacesFree: 0,
  customPalacesPremium: 20,
  customLessonsPerPalaceFree: 5,
  customLessonsPerPalacePremium: 50,
  customLocationsPerPalaceFree: 15,
  customLocationsPerPalacePremium: 100,
  customWordsPerLessonFree: 25,
  customWordsPerLessonPremium: 200,
};

const LIMIT_GROUPS: Array<{
  id: string;
  title: string;
  description: string;
  freeField: keyof FormValues;
  premiumField: keyof FormValues;
  unitLabel: string;
}> = [
  {
    id: "palaces",
    title: "Custom Palaces",
    description: "Maximum number of custom palaces a user can create.",
    freeField: "customPalacesFree",
    premiumField: "customPalacesPremium",
    unitLabel: "palaces",
  },
  {
    id: "lessons",
    title: "Lessons Per Palace",
    description: "Maximum custom lessons allowed in each custom palace.",
    freeField: "customLessonsPerPalaceFree",
    premiumField: "customLessonsPerPalacePremium",
    unitLabel: "lessons",
  },
  {
    id: "locations",
    title: "Locations Per Palace",
    description: "Maximum locations allowed in each custom palace.",
    freeField: "customLocationsPerPalaceFree",
    premiumField: "customLocationsPerPalacePremium",
    unitLabel: "locations",
  },
  {
    id: "words",
    title: "Words Per Lesson",
    description: "Maximum words allowed in each custom lesson.",
    freeField: "customWordsPerLessonFree",
    premiumField: "customWordsPerLessonPremium",
    unitLabel: "words",
  },
];

export function FeatureLimitsTab() {
  const [initialValues, setInitialValues] =
    useState<FormValues>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const formRef = React.useRef<any>(null);

  const loadLimits = async () => {
    setLoading(true);
    try {
      const result = await adminSystemSettingsApi.list(
        1,
        100,
        "feature_limits",
      );
      const setting = result.data.find((s) => s.key === "feature_limits");

      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        // Convert nested structure to flat structure for form
        const formValues: FormValues = {
          customPalacesFree:
            parsed.customPalaces?.free ?? DEFAULT_VALUES.customPalacesFree,
          customPalacesPremium:
            parsed.customPalaces?.premium ??
            DEFAULT_VALUES.customPalacesPremium,
          customLessonsPerPalaceFree:
            parsed.customLessonsPerPalace?.free ??
            DEFAULT_VALUES.customLessonsPerPalaceFree,
          customLessonsPerPalacePremium:
            parsed.customLessonsPerPalace?.premium ??
            DEFAULT_VALUES.customLessonsPerPalacePremium,
          customLocationsPerPalaceFree:
            parsed.customLocationsPerPalace?.free ??
            DEFAULT_VALUES.customLocationsPerPalaceFree,
          customLocationsPerPalacePremium:
            parsed.customLocationsPerPalace?.premium ??
            DEFAULT_VALUES.customLocationsPerPalacePremium,
          customWordsPerLessonFree:
            parsed.customWordsPerLesson?.free ??
            DEFAULT_VALUES.customWordsPerLessonFree,
          customWordsPerLessonPremium:
            parsed.customWordsPerLesson?.premium ??
            DEFAULT_VALUES.customWordsPerLessonPremium,
        };
        setInitialValues(formValues);
      }
    } catch (error) {
      console.error("Failed to load feature limits:", error);
      message.error("Failed to load feature limits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLimits();
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert flat structure to nested structure for storage
      const nestedData = {
        customPalaces: {
          free: values.customPalacesFree,
          premium: values.customPalacesPremium,
        },
        customLessonsPerPalace: {
          free: values.customLessonsPerPalaceFree,
          premium: values.customLessonsPerPalacePremium,
        },
        customLocationsPerPalace: {
          free: values.customLocationsPerPalaceFree,
          premium: values.customLocationsPerPalacePremium,
        },
        customWordsPerLesson: {
          free: values.customWordsPerLessonFree,
          premium: values.customWordsPerLessonPremium,
        },
      };

      await adminSystemSettingsApi.upsert({
        key: "feature_limits",
        value: JSON.stringify(nestedData),
        description: "Feature limits configuration for free and premium users",
      });
    },
    onSuccess: () => {
      message.success("Feature limits updated successfully!");
      void loadLimits();
    },
    onError: (error: any) => {
      console.error("Error saving feature limits:", error);
      message.error(error?.message || "Failed to save feature limits");
    },
  });

  return (
    <Card loading={loading} title="Feature Limits Configuration">
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Typography.Paragraph type="secondary">
          Configure the maximum resources allowed for free and premium users.
          Changes apply immediately.
        </Typography.Paragraph>

        <ProForm<FormValues>
          formRef={formRef}
          layout="vertical"
          initialValues={initialValues}
          key={JSON.stringify(initialValues)}
          submitter={{
            searchConfig: {
              submitText: "Save Limits",
              resetText: "Reset",
            },
            resetButtonProps: {
              disabled: saveMutation.isPending,
            },
            submitButtonProps: {
              loading: saveMutation.isPending,
            },
          }}
          onReset={() => {
            void loadLimits();
          }}
          onFinish={async (values: FormValues) => {
            await saveMutation.mutateAsync(values);
            return true;
          }}
        >
          <Row gutter={[24, 24]}>
            {LIMIT_GROUPS.map((group) => (
              <Col xs={24} lg={12} key={group.id}>
                <Card
                  size="small"
                  title={
                    <span>
                      {group.title}
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {group.unitLabel}
                      </Tag>
                    </span>
                  }
                  styles={{ body: { padding: "16px" } }}
                  bordered
                >
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 16 }}
                  >
                    {group.description}
                  </Typography.Text>
                  <Divider style={{ margin: "12px 0" }} />

                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <ProFormDigit
                      name={group.freeField}
                      label="Free Plan"
                      placeholder="Enter number"
                      min={0}
                      max={10000}
                      rules={[{ required: true, message: "Required" }]}
                      fieldProps={{
                        controls: true,
                      }}
                    />
                    <ProFormDigit
                      name={group.premiumField}
                      label="Premium Plan"
                      placeholder="Enter number"
                      min={0}
                      max={10000}
                      rules={[{ required: true, message: "Required" }]}
                      fieldProps={{
                        controls: true,
                      }}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </ProForm>
      </Space>
    </Card>
  );
}
