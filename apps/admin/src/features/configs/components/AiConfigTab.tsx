import { Alert, Space, Tabs } from "antd";
import ConfigEditorForm from "../../../components/ConfigEditorForm";
import { normalizeTextSettings } from "../utils/normalizeTextSettings";
import { useConfigEditor } from "../../../hooks/useConfigEditor";

const textDefaults = {
  provider: "template", model: "gemini-3.5-flash-lite",
  endpoint: "https://generativelanguage.googleapis.com/v1beta", apiKey: "",
  batchSize: 12, maxConcurrentRequests: 2, timeoutSeconds: 45,
};
const imageDefaults = {
  provider: "gemini", model: "gemini-3.1-flash-lite-image", apiKey: "",
  endpoint: "https://generativelanguage.googleapis.com/v1",
};
const creditDefaults = { textCost: 1, imageCost: 10, imagesEnabled: false };
const field = (title: string) => ({ type: "string", title, maxLength: 2000 });
const integer = (title: string, maximum: number, minimum = 1) => ({ type: "integer", title, minimum, maximum });
const sections = [
  { key: "ai.text", title: "Text generation", defaults: textDefaults, properties: {
    provider: { ...field("Provider"), enum: ["template", "gemini", "ollama"] },
    model: field("Model"), endpoint: field("API endpoint"),
    apiKey: field("API key (optional for local Ollama)"), batchSize: integer("Batch size", 20),
    maxConcurrentRequests: integer("Maximum concurrent requests", 10),
    timeoutSeconds: integer("Timeout (seconds)", 120, 5),
  }},
  { key: "ai.images", title: "Image generation", defaults: imageDefaults, properties: {
    provider: { ...field("Provider"), enum: ["gemini"] }, model: field("Image model"),
    endpoint: field("Image API endpoint"), apiKey: field("Image API key"),
  }},
  { key: "ai.credits", title: "Credits", defaults: creditDefaults, properties: {
    textCost: integer("Credits per AI sentence", 10000),
    imageCost: integer("Credits per image", 10000),
    imagesEnabled: { type: "boolean", title: "Enable image generation" },
  }},
];

function SettingsForm({ section }: { section: typeof sections[number] }) {
  const { config, isLoading, error, saveConfig } = useConfigEditor({
    configKey: section.key, defaultValue: section.defaults,
  });
  return <Space direction="vertical" style={{ width: "100%" }}>
    {error && <Alert type="error" message={error} />}
    {section.key === "ai.text" && <Alert type="info" showIcon
      message="Choose the provider, then set its model, endpoint and key."
      description="Gemini uses a base URL ending in /v1beta. Ollama uses its full /api/chat URL. When switching provider, update all three fields. Supported integrations: Gemini and Ollama; Template uses no external API." />}
    <ConfigEditorForm title={section.title} loading={isLoading} formData={section.key === "ai.text" ? normalizeTextSettings(config) : config} onSubmit={saveConfig}
      uiSchema={{ apiKey: { "ui:widget": "password" }, geminiApiKey: { "ui:widget": "password" } }}
      schema={{ type: "object", additionalProperties: false, properties: section.properties }} />
  </Space>;
}

export default function AiConfigTab() {
  return <Space direction="vertical" style={{ width: "100%" }}>
    <Alert type="info" showIcon message="AI configuration"
      description="Saved in the database. Changes apply to new requests and image jobs without restarting the API. Text and images have separate models and credentials. Template sentences are free; images require a model, API key, and the enable switch." />
    <Tabs items={sections.map((section) => ({
      key: section.key, label: section.title, children: <SettingsForm section={section} />,
    }))} />
  </Space>;
}
