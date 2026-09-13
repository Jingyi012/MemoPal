// Convert existing database rows to the provider-neutral editor shape.
export function normalizeTextSettings(config: Record<string, unknown>): Record<string, unknown> {
  const ollama = config.provider === "ollama";
  const openRouter = config.provider === "openrouter";
  return {
    provider: config.provider ?? "template",
    model: config.model ?? (openRouter ? config.openRouterModel : ollama ? config.ollamaModel : config.geminiModel) ?? "",
    endpoint: config.endpoint ?? (openRouter ? config.openRouterEndpoint : ollama ? config.ollamaEndpoint : config.geminiEndpoint) ??
      "",
    apiKey: config.apiKey ?? (openRouter ? config.openRouterApiKey : ollama ? config.ollamaApiKey : config.geminiApiKey) ?? "",
    batchSize: config.batchSize ?? 12,
    maxConcurrentRequests: config.maxConcurrentRequests ?? 2,
    timeoutSeconds: config.timeoutSeconds ?? 45,
    maxOutputTokens: config.maxOutputTokens ?? 2048,
    reasoningEnabled: config.reasoningEnabled ?? false,
  };
}
