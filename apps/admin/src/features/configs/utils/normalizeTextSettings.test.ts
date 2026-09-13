import { describe, expect, it } from "vitest";
import { normalizeTextSettings } from "./normalizeTextSettings";

describe("normalizeTextSettings", () => {
  it("defaults to bounded direct answers and preserves Admin overrides", () => {
    expect(normalizeTextSettings({ provider: "openrouter" })).toMatchObject({ maxOutputTokens: 2048, reasoningEnabled: false });
    expect(normalizeTextSettings({ provider: "openrouter", maxOutputTokens: 4096, reasoningEnabled: true }))
      .toMatchObject({ maxOutputTokens: 4096, reasoningEnabled: true });
  });
  it("uses OpenRouter defaults without inheriting Gemini credentials", () => {
    expect(normalizeTextSettings({ provider: "openrouter", geminiApiKey: "gemini-key" }))
      .toMatchObject({ endpoint: "", apiKey: "", model: "" });
  });
  it("maps provider fields while giving generic fields precedence", () => {
    expect(normalizeTextSettings({ provider: "openrouter", openRouterModel: "vendor/old",
      openRouterApiKey: "test-key", model: "vendor/new" }))
      .toMatchObject({ model: "vendor/new", apiKey: "test-key" });
  });
});
