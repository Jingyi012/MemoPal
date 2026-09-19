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
    public async Task AdminOutputControlsAreReadFromSavedSettings()
    {
        using var db = AiCreditTests.CreateDb();
        var result = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest
            { Key = AiSettings.Text, Value = """{"provider":"openrouter","maxOutputTokens":4096,"reasoningEnabled":true}""" }), default);
        Assert.True(result.Success);
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<AiTextGenerationOptions>([], [])).Value;
        Assert.Equal(4096, settings.MaxOutputTokens);
        Assert.True(settings.ReasoningEnabled);
    }

    [Fact]
    public async Task UnconfiguredTextUsesTemplateWithoutAnImplicitModel()
    {
        using var db = AiCreditTests.CreateDb();
        var options = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<AiTextGenerationOptions>([], [])).Value;
        Assert.Equal("template", options.Provider);
        Assert.Empty(options.Model);
        Assert.Empty(options.ApiKey);
        Assert.Empty(options.Endpoint);
        Assert.False(options.IsConfigured);
        Assert.Equal(2048, options.MaxOutputTokens);
        Assert.False(options.ReasoningEnabled);
        AiSettings.Validate(AiSettings.Text, """{"provider":"template","model":"","endpoint":"","apiKey":""}""");
    }

    [Fact]
    public async Task LegacyTextRowsRemainReadable()
    {
        using var db = AiCreditTests.CreateDb();
        db.SystemSettings.Add(new SystemSetting { Id = "legacy", Key = AiSettings.Text,
            Value = "{\"provider\":\"gemini\",\"geminiModel\":\"legacy-model\",\"geminiApiKey\":\"legacy-key\"}" });
        await db.SaveChangesAsync();
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<AiTextGenerationOptions>([], [])).Value;
        Assert.Equal("legacy-model", settings.Model);
        Assert.Equal("legacy-key", settings.ApiKey);
    }

    [Theory]
    [InlineData("gemini", "https://example.test/v1beta")]
    [InlineData("ollama", "http://localhost:11434/api/chat")]
    [InlineData("openrouter", "https://openrouter.ai/api/v1/chat/completions")]
    public async Task GenericTextFieldsSelectTheCorrectTransport(string provider, string endpoint)
    {
        using var db = AiCreditTests.CreateDb();
        var json = System.Text.Json.JsonSerializer.Serialize(new { provider, model = "chosen-model", endpoint, apiKey = "chosen-key" });
        var saved = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest { Key = AiSettings.Text, Value = json }), default);
        Assert.True(saved.Success);
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<AiTextGenerationOptions>([], [])).Value;
        Assert.Equal("chosen-model", settings.Model);
        Assert.Equal(endpoint, settings.Endpoint);
        Assert.Equal("chosen-key", settings.ApiKey);
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

    [Fact]
    public async Task ExplicitGenericEmptyValuesDoNotRestoreLegacyCredentials()
    {
        using var db = AiCreditTests.CreateDb();
        db.SystemSettings.Add(new SystemSetting { Id = "mixed", Key = AiSettings.Text,
            Value = """{"provider":"gemini","model":"","apiKey":"","endpoint":"","geminiModel":"old-model","geminiApiKey":"old-key","geminiEndpoint":"https://example.test"}""" });
        await db.SaveChangesAsync();
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Text, new OptionsFactory<AiTextGenerationOptions>([], [])).Value;
        Assert.Empty(settings.Model);
        Assert.Empty(settings.ApiKey);
        Assert.Empty(settings.Endpoint);
        Assert.False(settings.IsConfigured);
    }

    [Fact]
    public async Task CreditPurchaseCatalogIsValidatedAndReadFromSavedSettings()
    {
        using var db = AiCreditTests.CreateDb();
        var json = """{"textCost":1,"imageCost":10,"imagesEnabled":false,"purchasesEnabled":true,"currencyCode":"MYR","currencySymbol":"RM","customPurchaseEnabled":true,"customMinCredits":50,"customMaxCredits":5000,"customStep":10,"pricePerCredit":0.05,"purchasePacks":[{"key":"popular","credits":250,"price":9.99,"label":"Popular","badge":"BEST VALUE","isActive":true,"sortOrder":1}]}""";

        var saved = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest
            { Key = AiSettings.Credits, Value = json }), default);

        Assert.True(saved.Success);
        var settings = new DatabaseAiSettings(db).Read(AiSettings.Credits, new OptionsFactory<AiCreditOptions>([], [])).Value;
        Assert.True(settings.PurchasesEnabled);
        Assert.Equal("MYR", settings.CurrencyCode);
        Assert.Equal(0.05m, settings.PricePerCredit);
        Assert.Equal(250, Assert.Single(settings.PurchasePacks).Credits);
    }

    [Theory]
    [InlineData("ai.credits", "{\"textCost\":0}")]
    [InlineData("ai.credits", "{\"purchasePacks\":[{\"key\":\"same\",\"credits\":100,\"price\":4.99,\"label\":\"One\"},{\"key\":\"same\",\"credits\":200,\"price\":8.99,\"label\":\"Two\"}]}")]
    [InlineData("ai.images", "{\"provider\":\"ollama\"}")]
    [InlineData("ai.images", "{\"endpoint\":\"file:///tmp\"}")]
    [InlineData("ai.text", "{\"geminiApiKey\":null}")]
    [InlineData("ai.text", "not-json")]
    [InlineData("ai.text", "{\"maxOutputTokens\":0}")]
    [InlineData("ai.text", "{\"maxOutputTokens\":32769}")]
    [InlineData("ai.text", "{\"reasoningEnabled\":\"false\"}")]
    [InlineData("ai.text", "{\"provider\":\"openrouter\",\"endpoint\":\"http://openrouter.ai/api/v1/chat/completions\"}")]
    public async Task RejectsInvalidSettingsWithoutSaving(string key, string value)
    {
        using var db = AiCreditTests.CreateDb();
        var result = await new UpsertSystemSettingCommandHandler(db).Handle(new(new UpsertSystemSettingRequest { Key = key, Value = value }), default);
        Assert.False(result.Success);
        Assert.Empty(db.SystemSettings);
    }
}
