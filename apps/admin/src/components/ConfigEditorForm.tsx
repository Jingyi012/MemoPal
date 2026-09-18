import React from "react";
import { withTheme } from "@rjsf/core";
import { Theme as AntdTheme } from "@rjsf/antd";
import Validator from "@rjsf/validator-ajv8";
import type { UiSchema } from "@rjsf/utils";
import {
  App,
  Button,
  Space,
  Spin,
  Collapse,
  Typography,
  Divider,
  ConfigProvider,
  theme,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { extractApiErrorMessage } from "../lib/errorMessage";

const Form = withTheme(AntdTheme);

interface ConfigEditorFormProps {
  schema: Record<string, unknown>;
  uiSchema?: UiSchema;
  formData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  loading?: boolean;
}

const ArrayFieldTemplate = (props: any) => {
  const { items, onAddClick, onDropIndexClick, title, canAdd, description } =
    props;

  const resolveItemLabel = (
    data: Record<string, unknown>,
    fallbackTitle: string,
    index: number,
  ): string => {
    const levelValue = Number(data.level);
    if (Number.isFinite(levelValue) && levelValue > 0) {
      return `Level ${levelValue}`;
    }

    const numberValue = Number(data.number);
    if (Number.isInteger(numberValue) && numberValue >= 1) {
      const pegName = typeof data.name === "string" ? data.name.trim() : "";
      return pegName
        ? `${numberValue} - ${pegName}${data.icon}`
        : String(numberValue);
    }

    if (typeof data.key === "string" && data.key.trim().length > 0) {
      return data.key.trim();
    }

    if (typeof data.id === "string" && data.id.trim().length > 0) {
      return data.id.trim();
    }

    if (typeof data.name === "string" && data.name.trim().length > 0) {
      return data.name.trim();
    }

    if (typeof data.title === "string" && data.title.trim().length > 0) {
      return data.title.trim();
    }

    return `${fallbackTitle} ${index + 1}`;
  };

  const handleDeleteClick = (
    item: any,
    itemProps: any,
    index: number,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const resolvedIndex =
      typeof itemProps?.index === "number"
        ? itemProps.index
        : typeof item?.index === "number"
          ? item.index
          : index;

    // rjsf ArrayFieldItem signature: handleRemoveItem(event, index)
    if (typeof itemProps?.handleRemoveItem === "function") {
      itemProps.handleRemoveItem(e, resolvedIndex);
      return;
    }

    if (typeof item?.props?.handleRemoveItem === "function") {
      item.props.handleRemoveItem(e, resolvedIndex);
      return;
    }

    // Fallback template API: onDropIndexClick(index)(event)
    if (typeof onDropIndexClick === "function") {
      const remove = onDropIndexClick(resolvedIndex);
      if (typeof remove === "function") {
        remove(e);
      }
    }
  };

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
        style={{ background: "#f8faf9", borderRadius: 12 }}
        items={(items || []).map((item: any, index: number) => {
          const itemProps = item.props || {};
          const data = (itemProps.itemData || {}) as Record<string, unknown>;
          const label = resolveItemLabel(data, title, index);
          const canDelete = item?.hasRemove ?? itemProps?.hasRemove ?? true;

          return {
            key: itemProps.itemKey || `item-${index}`,
            label: <Typography.Text strong>{label}</Typography.Text>,
            extra: (
              <DeleteOutlined
                style={{ color: canDelete ? "#ff4d4f" : "#bfbfbf" }}
                onClick={(e) => {
                  if (!canDelete) return;
                  handleDeleteClick(item, itemProps, index, e);
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
  const hiddenSystemFields = new Set([
    "createdAt",
    "updatedAt",
    "deletedAt",
    "lastSyncedAt",
  ]);

  const shouldWrap = !!title;
  const depth = name ? name.split(".").length : 0;

  return (
    <div
      style={{
        marginBottom: shouldWrap ? 12 : 0,
        padding: shouldWrap ? "20px" : 0,
        border: shouldWrap ? "1px solid #e5eae9" : "none",
        borderRadius: 12,
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: 16,
          paddingLeft: depth > 1 ? 8 : 0,
          borderLeft: depth > 1 ? "1px dashed #e8e8e8" : "none",
        }}
      >
        {properties.map((prop: any) => {
          const fieldName = typeof prop?.name === "string" ? prop.name : "";
          if (
            prop.hidden ||
            hiddenSystemFields.has(fieldName) ||
            hiddenSystemFields.has(fieldName.split(".").at(-1) ?? "")
          ) {
            return null;
          }

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
  uiSchema,
  formData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { message } = App.useApp();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async ({ formData }: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      message.success("Configuration updated successfully");
    } catch (error) {
      message.error(
        extractApiErrorMessage(error, "Failed to save configuration"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { borderRadius: 8 },
      }}
    >
      <Spin spinning={loading || isSubmitting} wrapperClassName="portal-config-form">
        <Form
          schema={schema as any}
          uiSchema={uiSchema}
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
