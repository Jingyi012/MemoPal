// Convert existing database rows to the provider-neutral editor shape.
export function normalizeTextSettings(config: Record<string, unknown>): Record<string, unknown> {
  const ollama = config.provider === "ollama";
  return {
    provider: config.provider ?? "template",
    model: config.model ?? (ollama ? config.ollamaModel : config.geminiModel) ?? "",
    endpoint: config.endpoint ?? (ollama ? config.ollamaEndpoint : config.geminiEndpoint) ??
      (ollama ? "http://localhost:11434/api/chat" : "https://generativelanguage.googleapis.com/v1beta"),
    apiKey: config.apiKey ?? (ollama ? "" : config.geminiApiKey) ?? "",
    batchSize: config.batchSize ?? 12,
    maxConcurrentRequests: config.maxConcurrentRequests ?? 2,
    timeoutSeconds: config.timeoutSeconds ?? 45,
  };
}
