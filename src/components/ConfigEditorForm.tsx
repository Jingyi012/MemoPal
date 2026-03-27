import React from "react";
import { withTheme } from "@rjsf/core";
import { Theme as AntdTheme } from "@rjsf/antd";
import Validator from "@rjsf/validator-ajv8";
import {
  Button,
  Space,
  message,
  Spin,
  Collapse,
  Typography,
  Divider,
  ConfigProvider,
  theme,
} from "antd";
import { ProCard } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const Form = withTheme(AntdTheme);

interface ConfigEditorFormProps {
  schema: Record<string, unknown>;
  formData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  loading?: boolean;
}

const ArrayFieldTemplate = (props: any) => {
  const { items, onAddClick, title, canAdd, description } = props;

  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Text strong style={{ fontSize: 14 }}>
        {title}
      </Typography.Text>
      {description && (
        <div style={{ marginBottom: 4 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Typography.Text>
        </div>
      )}
      <Collapse
        ghost
        expandIconPosition="end"
        style={{ background: "#fafafa", borderRadius: 6 }}
        items={(items || []).map((item: any, index: number) => {
          const itemProps = item.props || {};
          const data = itemProps.itemData || {};
          const label =
            data.title || data.key || data.name || `${title} ${index + 1}`;

          return {
            key: itemProps.itemKey || `item-${index}`,
            label: <Typography.Text strong>{label}</Typography.Text>,
            extra: (
              <DeleteOutlined
                style={{ color: "#ff4d4f" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (itemProps.handleRemoveItem) {
                    itemProps.handleRemoveItem(itemProps.index)(e);
                  }
                }}
              />
            ),
            children: (
              <div style={{ paddingTop: 4, paddingBottom: 4 }}>{item}</div>
            ),
          };
        })}
      />
      {canAdd && (
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={onAddClick}
          style={{ marginTop: 8, borderRadius: 6 }} /* Decreased from 12 */
        >
          Add {title}
        </Button>
      )}
    </div>
  );
};

const ObjectFieldTemplate = (props: any) => {
  const { properties, title, description, name } = props;

  const shouldWrap = !!title;
  const depth = name ? name.split(".").length : 0;

  return (
    <div
      style={{
        marginBottom: shouldWrap ? 12 : 0,
        padding: shouldWrap ? "8px 12px" : 0,
        border: shouldWrap ? "1px solid #f0f0f0" : "none",
        borderRadius: 6,
        background: shouldWrap ? "white" : "transparent",
      }}
    >
      {title && (
        <div style={{ marginBottom: 8 }}>
          <Typography.Text strong style={{ fontSize: depth <= 1 ? 15 : 13 }}>
            {title}
          </Typography.Text>
          {description && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {description}
            </div>
          )}
          <Divider style={{ margin: "4px 0" }} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingLeft: depth > 1 ? 8 : 0,
          borderLeft: depth > 1 ? "1px dashed #e8e8e8" : "none",
        }}
      >
        {properties.map((prop: any) => {
          if (prop.hidden) return null;

          return (
            <div key={prop.name} style={{ width: "100%" }}>
              {prop.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ConfigEditorForm: React.FC<ConfigEditorFormProps> = ({
  schema,
  formData,
  onSubmit,
  onCancel,
  title,
  loading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async ({ formData }: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      message.success("Configuration updated successfully");
    } catch (error) {
      console.error("Submission error:", error);
      message.error("Failed to save configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { borderRadius: 6 },
      }}
    >
      <Spin spinning={loading || isSubmitting}>
        <Form
          schema={schema as any}
          formData={formData}
          validator={Validator}
          onSubmit={handleSubmit}
          liveValidate
          showErrorList={false}
          templates={{
            ArrayFieldTemplate,
            ObjectFieldTemplate,
            ButtonTemplates: {
              AddButton: () => <React.Fragment />,
              RemoveButton: () => <React.Fragment />,
              MoveUpButton: () => <React.Fragment />,
              MoveDownButton: () => <React.Fragment />,
              SubmitButton: () => <React.Fragment />,
            },
          }}
        >
          <div
            style={{
              marginTop: 40,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Space size="middle">
              {onCancel && (
                <Button onClick={onCancel} size="large">
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                size="large"
                style={{ minWidth: 150 }}
              >
                Save Changes
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>
    </ConfigProvider>
  );
};

export default ConfigEditorForm;
