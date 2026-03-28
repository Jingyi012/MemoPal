import React, { useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { App, Button, Card, Space, Spin, Alert } from "antd";
import Ajv from "ajv";

interface AdvancedJsonEditorProps {
  value: Record<string, unknown>;
  schema?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  loading?: boolean;
  height?: string;
}

/**
 * Advanced JSON editor using Monaco Editor
 * Provides code-like editing experience with syntax highlighting and validation
 */
export const AdvancedJsonEditor: React.FC<AdvancedJsonEditorProps> = ({
  value,
  schema,
  onSubmit,
  onCancel,
  title = "Advanced JSON Editor",
  loading = false,
  height = "400px",
}) => {
  const { message } = App.useApp();
  const [editorValue, setEditorValue] = React.useState(
    JSON.stringify(value, null, 2),
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  const ajv = useMemo(() => new Ajv(), []);

  const validateJson = useCallback(
    (jsonString: string): Record<string, unknown> | null => {
      try {
        const parsedData = JSON.parse(jsonString) as Record<string, unknown>;

        if (schema) {
          const validate = ajv.compile(schema as Record<string, unknown>);
          const isValid = validate(parsedData);

          if (!isValid) {
            const errorMessages = validate.errors
              ?.map((err) => `${err.instancePath || "root"}: ${err.message}`)
              .join("\n");
            setValidationError(errorMessages || "Validation failed");
            return null;
          }
        }

        setValidationError(null);
        return parsedData;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid JSON";
        setValidationError(`JSON Parse Error: ${errorMessage}`);
        return null;
      }
    },
    [schema, ajv],
  );

  const handleSubmit = async () => {
    const parsedData = validateJson(editorValue);

    if (!parsedData) {
      message.error("Please fix validation errors");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parsedData);
      message.success("Configuration saved successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save configuration";
      message.error(errorMessage);
      console.error("Config submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      validateJson(value);
    }
  };

  const handleReset = () => {
    setEditorValue(JSON.stringify(value, null, 2));
    setValidationError(null);
  };

  return (
    <Spin spinning={loading || isSubmitting}>
      <Card title={title} style={{ marginBottom: 16 }}>
        {validationError && (
          <Alert
            type="error"
            message="Validation Error"
            description={validationError}
            showIcon
            closable
            onClose={() => setValidationError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Editor
          height={height}
          defaultLanguage="json"
          value={editorValue}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: "always",
          }}
        />

        <Space
          style={{ marginTop: 16, display: "flex", justifyContent: "end" }}
        >
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!!validationError}
          >
            Save Configuration
          </Button>
          <Button onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
          {onCancel && (
            <Button onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </Space>
      </Card>
    </Spin>
  );
};

export default AdvancedJsonEditor;
