using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.SystemSettings.Commands;
using MemoPal.Application.Features.SystemSettings.DTOs;
using MemoPal.Application.Features.SystemSettings.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.AI;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class DatabaseAiSettingsTests
{
    [Fact]
    public async Task LegacyTextRowsRemainReadable()
    {
        using var db = AiCreditTests.CreateDb();
        db.SystemSettings.Add(new SystemSetting { Id = "legacy", Key = AiSettings.Text,
            Value = "{\"provider\":\"gemini\",\"geminiModel\":\"legacy-model\",\"geminiApiKey\":\"legacy-key\"}" });
        await db.SaveChangesAsync();
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<PalaceAssociationGenerationOptions>([], [])).Value;
        Assert.Equal("legacy-model", settings.GeminiModel);
        Assert.Equal("legacy-key", settings.GeminiApiKey);
    }

    [Theory]
    [InlineData("gemini", "https://example.test/v1beta")]
    [InlineData("ollama", "http://localhost:11434/api/chat")]
    public async Task GenericTextFieldsSelectTheCorrectTransport(string provider, string endpoint)
    {
        using var db = AiCreditTests.CreateDb();
        var json = System.Text.Json.JsonSerializer.Serialize(new { provider, model = "chosen-model", endpoint, apiKey = "chosen-key" });
        var saved = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest { Key = AiSettings.Text, Value = json }), default);
        Assert.True(saved.Success);
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<PalaceAssociationGenerationOptions>([], [])).Value;
        Assert.Equal("chosen-model", provider == "gemini" ? settings.GeminiModel : settings.OllamaModel);
        Assert.Equal(endpoint, provider == "gemini" ? settings.GeminiEndpoint : settings.OllamaEndpoint);
        Assert.Equal("chosen-key", provider == "gemini" ? settings.GeminiApiKey : settings.OllamaApiKey);
    }

    [Fact]
    public async Task SavedSettingsApplyToNewScopesButStayConsistentWithinRequest()
    {
        using var db = AiCreditTests.CreateDb();
        var handler = new UpsertSystemSettingCommandHandler(db);
        var first = await handler.Handle(new(new UpsertSystemSettingRequest { Key = AiSettings.Images,
            Value = "{\"model\":\"first\",\"apiKey\":\"private-key\"}" }), default);
        Assert.True(first.Success);
        var factory = new OptionsFactory<AiImageGenerationOptions>([], []);
        var scope = new DatabaseAiSettings(db);
        Assert.Equal("first", scope.Read(AiSettings.Images, factory).Value.Model);
        await handler.Handle(new(new UpsertSystemSettingRequest { Key = AiSettings.Images,
            Value = "{\"model\":\"second\",\"apiKey\":\"other-key\"}" }), default);
        Assert.Equal("first", scope.Read(AiSettings.Images, factory).Value.Model);
        Assert.Equal("second", new DatabaseAiSettings(db).Read(AiSettings.Images, factory).Value.Model);
        db.SystemSettings.Add(new SystemSetting { Id = "public", Key = "support.help_faq", Value = "{}" });
        await db.SaveChangesAsync();
        var publicSettings = await new GetAllSystemSettingsQueryHandler(db).Handle(new(), default);
        Assert.Single(publicSettings.Data!);
        Assert.DoesNotContain(publicSettings.Data!, x => x.Key.StartsWith("ai."));
    }

    [Theory]
    [InlineData("ai.credits", "{\"textCost\":0}")]
    [InlineData("ai.images", "{\"provider\":\"ollama\"}")]
    [InlineData("ai.images", "{\"endpoint\":\"file:///tmp\"}")]
    [InlineData("ai.text", "{\"geminiApiKey\":null}")]
    [InlineData("ai.text", "not-json")]
    public async Task RejectsInvalidSettingsWithoutSaving(string key, string value)
    {
        using var db = AiCreditTests.CreateDb();
        var result = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest { Key = key, Value = value }), default);
        Assert.False(result.Success);
        Assert.Empty(db.SystemSettings);
    }
}
