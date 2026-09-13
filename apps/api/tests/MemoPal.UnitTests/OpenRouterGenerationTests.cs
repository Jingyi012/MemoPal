using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class OpenRouterGenerationTests
{
    [Fact]
    public async Task TransportCancellationIsIdentifiedWithoutPretendingDeadlineExpired()
    {
        var cancellation = new TaskCanceledException();
        using var client = new HttpClient(new CancelledHandler(cancellation));
        var result = await new NumberPegStoryGenerator(client, Options.Create(Settings()),
            NullLogger<NumberPegStoryGenerator>.Instance)
            .GenerateAsync([new(1, 1, "candle", "one candle", "apple", null)], "en", "playful");
        Assert.Equal("template", result.Source);
        Assert.Equal("http-transport", cancellation.Data["CancellationSource"]);
        Assert.Equal("waiting-for-headers", cancellation.Data["Phase"]);
    }

    private sealed class CancelledHandler(TaskCanceledException error) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => throw error;
    }

    [Fact]
    public async Task SuccessfulHeadersWithCancelledBodyPreserveExistingStory()
    {
        var error = new TaskCanceledException();
        using var client = new HttpClient(new CancelledBodyHandler(error));
        var result = await new NumberPegStoryGenerator(client, Options.Create(Settings()),
            NullLogger<NumberPegStoryGenerator>.Instance)
            .GenerateAsync([new(1, 1, "candle", "one candle", "apple", "An apple hugs a candle.")], "en", "playful");
        Assert.Equal("template", result.Source);
        Assert.Equal("An apple hugs a candle.", result.Suggestions.Single().Story);
        Assert.Equal("reading-body", error.Data["Phase"]);
        Assert.Equal(200, error.Data["ResponseStatus"]);
    }

    private sealed class CancelledBodyHandler(TaskCanceledException error) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new CancelledContent(error) });
    }

    private sealed class CancelledContent(TaskCanceledException error) : HttpContent
    {
        protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context) => throw error;
        protected override bool TryComputeLength(out long length) { length = 0; return false; }
    }

    private static AiTextGenerationOptions Settings() => new()
    {
        Provider = "openrouter", Endpoint = "https://openrouter.ai/api/v1/chat/completions", ApiKey = "test-key", Model = "vendor/model"
    };

    [Fact]
    public async Task BothGeneratorsUseOpenRouterAndParseSuggestions()
    {
        var handler = new Handler(new { choices = new[] { new { message = new { content =
            """{"suggestions":[{"position":1,"story":"A candle hugs apple","associationText":"An apple dances on the desk"}]}"""
        } } } });
        using var client = new HttpClient(handler);
        var options = Options.Create(Settings());
        var story = await new NumberPegStoryGenerator(client, options, NullLogger<NumberPegStoryGenerator>.Instance)
            .GenerateAsync([new(1, 1, "candle", "one candle", "apple", null)], "en", "playful");
        var palace = await new PalaceAssociationGenerator(client, options, NullLogger<PalaceAssociationGenerator>.Instance)
            .GenerateAsync([new(1, "apple", "desk", null)], "en", "vivid", false);
        Assert.Equal("ai", story.Source);
        Assert.Equal("ai", palace.Source);
        Assert.True(story.Suggestions.Single().IsAi);
        Assert.True(palace.Suggestions.Single().IsAi);
        Assert.Equal(2, handler.Calls);
    }

    [Theory]
    [InlineData("{\"error\":{\"message\":\"private provider error\"}}", 200)]
    [InlineData("{\"choices\":[]}", 200)]
    [InlineData("{\"choices\":[{\"message\":{\"content\":null}}]}", 200)]
    [InlineData("{}", 429)]
    public async Task FailuresFallBackForBothGenerators(string json, int status)
    {
        var handler = new Handler(JsonSerializer.Deserialize<JsonElement>(json), (HttpStatusCode)status);
        using var client = new HttpClient(handler);
        var options = Options.Create(Settings());
        var story = await new NumberPegStoryGenerator(client, options, NullLogger<NumberPegStoryGenerator>.Instance)
            .GenerateAsync([new(1, 1, "candle", "one candle", "apple", null)], "en", "playful");
        var palace = await new PalaceAssociationGenerator(client, options, NullLogger<PalaceAssociationGenerator>.Instance)
            .GenerateAsync([new(1, "apple", "desk", null)], "en", "vivid", false);
        Assert.Equal("template", story.Source);
        Assert.Equal("template", palace.Source);
    }

    [Fact]
    public async Task MissingKeyDoesNotCallProvider()
    {
        var settings = Settings();
        settings.ApiKey = "";
        var handler = new Handler(new { });
        using var client = new HttpClient(handler);
        var options = Options.Create(settings);
        var result = await new NumberPegStoryGenerator(client, options, NullLogger<NumberPegStoryGenerator>.Instance)
            .GenerateAsync([new(1, 1, "candle", "one candle", "apple", null)], "en", "playful");
        Assert.Equal("template", result.Source);
        Assert.Equal(0, handler.Calls);
    }

    private sealed class Handler(object response, HttpStatusCode status = HttpStatusCode.OK) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Calls++;
            Assert.Equal("https://openrouter.ai/api/v1/chat/completions", request.RequestUri!.AbsoluteUri);
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
            Assert.Equal("test-key", request.Headers.Authorization?.Parameter);
            var body = await request.Content!.ReadFromJsonAsync<JsonElement>(ct);
            Assert.Equal("vendor/model", body.GetProperty("model").GetString());
            Assert.False(body.GetProperty("stream").GetBoolean());
            Assert.Equal(2048, body.GetProperty("max_tokens").GetInt32());
            Assert.False(body.GetProperty("reasoning").GetProperty("enabled").GetBoolean());
            Assert.Contains("apple", body.GetProperty("messages")[0].GetProperty("content").GetString());
            return new(status) { Content = JsonContent.Create(response) };
        }
    }
}
