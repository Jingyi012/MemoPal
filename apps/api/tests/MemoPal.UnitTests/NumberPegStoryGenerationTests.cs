using System.Net;
using System.Text;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.NumberPegStories.Commands;
using MemoPal.Application.Features.NumberPegStories.DTOs;
using MemoPal.Infrastructure.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class NumberPegStoryGenerationTests
{
    [Fact]
    public async Task OpenRouterRepairsRejectedChineseStoryOnceAndSendsReadableChinese()
    {
        var handler = new QueueHttpHandler(OpenRouterResponse("""{"suggestions":[{"position":1,"story":"一片红色的云飘过。"}]}"""),
            OpenRouterResponse("""{"suggestions":[{"position":1,"story":"红色的蜡烛跳进喷泉。"}]}"""));
        var generator = new NumberPegStoryGenerator(new HttpClient(handler), Options.Create(new AiTextGenerationOptions {
            Provider = "openrouter", Model = "test-model", ApiKey = "test-key", Endpoint = "https://openrouter.ai/api/v1/chat/completions"
        }), NullLogger<NumberPegStoryGenerator>.Instance);
        var result = await generator.GenerateAsync([new(1, 1, "蜡烛", "一支蜡烛", "红色", null)], "zh", "playful");
        Assert.Equal("ai", result.Source);
        Assert.Equal("红色的蜡烛跳进喷泉。", result.Suggestions.Single().Story);
        Assert.Equal(2, handler.Requests.Count);
        using var body = System.Text.Json.JsonDocument.Parse(handler.RequestBodies[0]);
        var prompt = body.RootElement.GetProperty("messages")[0].GetProperty("content").GetString()!;
        Assert.Contains("红色", prompt);
        Assert.Contains("蜡烛", prompt);
        Assert.DoesNotContain("\\u", prompt);
    }

    [Fact]
    public async Task OpenRouterImprovesEditedStoryInsteadOfReplacingItsCoreIdea()
    {
        const string editedStory = "A red candle melts beside an old window while an apple sails past.";
        var handler = new QueueHttpHandler(OpenRouterResponse("""{"suggestions":[{"position":1,"story":"A red candle flickers beside the old window as an apple sails past."}]}"""));
        var generator = new NumberPegStoryGenerator(new HttpClient(handler), Options.Create(new AiTextGenerationOptions {
            Provider = "openrouter", Model = "test-model", ApiKey = "test-key", Endpoint = "https://openrouter.ai/api/v1/chat/completions"
        }), NullLogger<NumberPegStoryGenerator>.Instance);

        var result = await generator.GenerateAsync([Item() with { ExistingStory = editedStory, ImproveExisting = true }], "en", "playful");

        Assert.Equal("ai", result.Source);
        Assert.Equal("A red candle flickers beside the old window as an apple sails past.", result.Suggestions.Single().Story);
        var prompt = handler.RequestBodies.Single();
        Assert.Contains(editedStory, prompt);
        Assert.Contains("improveExisting", prompt);
        Assert.Contains("When improveExisting is true", prompt);
        Assert.Contains("Preserve its core event, setting, and useful concrete details", prompt);
    }

    [Fact]
    public async Task FailedRepairKeepsAcceptedStoriesAndDoesNotRetryAgain()
    {
        var handler = new QueueHttpHandler(OpenRouterResponse("""{"suggestions":[{"position":1,"story":"A candle hugs apple"}]}"""),
            new HttpResponseMessage(HttpStatusCode.TooManyRequests));
        var generator = new NumberPegStoryGenerator(new HttpClient(handler), Options.Create(new AiTextGenerationOptions {
            Provider = "openrouter", Model = "test-model", ApiKey = "test-key", Endpoint = "https://openrouter.ai/api/v1/chat/completions"
        }), NullLogger<NumberPegStoryGenerator>.Instance);
        var result = await generator.GenerateAsync([Item(), Item(2) with { ExistingStory = "My original story" }], "en", "playful");
        Assert.Equal("mixed", result.Source);
        Assert.True(result.Suggestions[0].IsAi);
        Assert.Equal("My original story", result.Suggestions[1].Story);
        Assert.Equal(2, handler.Requests.Count);
    }

    private static HttpResponseMessage OpenRouterResponse(string content) => JsonResponse(
        System.Text.Json.JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } }));

    [Theory]
    [InlineData("en")]
    [InlineData("zh")]
    public async Task FailedRefinementsPreserveOriginalAcrossRepeatedRetries(string locale)
    {
        var original = "A candle hugs apple beside the candle peg";
        var item = Item() with { ExistingStory = original, ImproveExisting = true };
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var generator = CreateGenerator(new QueueHttpHandler(new HttpResponseMessage(HttpStatusCode.BadRequest)));
            var result = await generator.GenerateAsync([item], locale, "playful");
            Assert.Equal("template", result.Source);
            Assert.Equal(original, result.Suggestions.Single().Story);
            Assert.False(result.Suggestions.Single().IsAi);
            item = item with { ExistingStory = result.Suggestions.Single().Story };
        }
    }

    [Fact]
    public async Task OllamaUsesConfiguredBearerCredential()
    {
        var handler = new QueueHttpHandler(JsonResponse("""{"message":{"content":"{\"suggestions\":[{\"position\":1,\"story\":\"A candle hugs apple\"}]}"}}"""));
        var generator = new NumberPegStoryGenerator(new HttpClient(handler),
            Options.Create(new AiTextGenerationOptions { Provider = "ollama", Model = "test-model", ApiKey = "test-credential", Endpoint = "http://localhost/api/chat" }),
            NullLogger<NumberPegStoryGenerator>.Instance);
        var result = await generator.GenerateAsync([Item()], "en", "playful");
        Assert.Equal("ai", result.Source);
        Assert.Equal("Bearer", handler.Requests.Single().Headers.Authorization?.Scheme);
        Assert.Equal("test-credential", handler.Requests.Single().Headers.Authorization?.Parameter);
    }

    [Fact]
    public async Task Handler_RejectsNullItemBeforeSorting()
    {
        var handler = new GenerateNumberPegStoriesCommandHandler(new StubGenerator(), null!);
        var request = new GenerateNumberPegStoriesRequest { Items = [null!] };
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("user", request), default));
    }

    [Fact]
    public async Task Generator_AcceptsStoryContainingTargetAndPegAndCreativeQuestion()
    {
        var handler = new QueueHttpHandler(JsonResponse("""{"message":{"content":"{\"suggestions\":[{\"position\":1,\"story\":\"A candle hugs apple beside the candle peg\",\"creativeQuestion\":\"What moved?\"}]}"}}"""));
        var generator = CreateGenerator(handler);

        var result = await generator.GenerateAsync([Item()], "en", "playful");

        Assert.Equal("ai", result.Source);
        Assert.Equal("A candle hugs apple beside the candle peg", result.Suggestions[0].Story);
        Assert.Equal("What moved?", result.Suggestions[0].CreativeQuestion);
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("{\"items\":[]}")]
    public async Task Generator_UsesTemplateFallbackForMalformedOrInvalidRoot(string content)
    {
        var generator = CreateGenerator(new QueueHttpHandler(JsonResponse($"{{\"message\":{{\"content\":{System.Text.Json.JsonSerializer.Serialize(content)}}}}}")));

        var result = await generator.GenerateAsync([Item()], "en", "playful");

        Assert.Equal("template", result.Source);
        Assert.Contains("apple", result.Suggestions[0].Story);
        Assert.Contains("candle", result.Suggestions[0].Story);
    }

    [Fact]
    public async Task Generator_ReturnsMixedForPartialBatchAndTemplatesMissingPosition()
    {
        var content = "{\"message\":{\"content\":\"{\\\"suggestions\\\":[{\\\"position\\\":1,\\\"story\\\":\\\"A candle hugs apple beside the candle peg\\\"}]}\"}}";
        var generator = CreateGenerator(new QueueHttpHandler(JsonResponse(content)));

        var result = await generator.GenerateAsync([Item(1), Item(2)], "en", "playful");

        Assert.Equal("mixed", result.Source);
        Assert.Equal(2, result.Suggestions.Count);
        Assert.Contains("apple", result.Suggestions[1].Story);
    }

    [Fact]
    public async Task Generator_UsesFallbackWhenProviderTimesOut()
    {
        var generator = CreateGenerator(new QueueHttpHandler(new Func<HttpResponseMessage>(() => throw new TaskCanceledException("provider timeout"))));

        var result = await generator.GenerateAsync([Item()], "en", "playful");

        Assert.Equal("template", result.Source);
    }

    [Fact]
    public async Task Generator_PropagatesCallerCancellation()
    {
        using var cancellation = new CancellationTokenSource();
        var handler = new QueueHttpHandler(new Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>>((_, token) => Task.FromCanceled<HttpResponseMessage>(token)));
        var generator = CreateGenerator(handler);
        cancellation.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() => generator.GenerateAsync([Item()], "en", "playful", cancellation.Token));
    }

    [Fact]
    public async Task Generator_BatchesUsingConfiguredBatchSizeAndPreservesRefinementData()
    {
        var handler = new QueueHttpHandler(
            new Func<HttpResponseMessage>(() => throw new TaskCanceledException("provider timeout")),
            JsonResponse("""{"message":{"content":"{\"suggestions\":[{\"position\":2,\"story\":\"A candle hugs apple beside the candle peg\"}]}"}}"""));
        var options = Options.Create(new AiTextGenerationOptions
        {
            Provider = "ollama", Model = "test-model",
            BatchSize = 1,
            Endpoint = "http://localhost/api/chat"
        });
        var generator = new NumberPegStoryGenerator(new HttpClient(handler), options, NullLogger<NumberPegStoryGenerator>.Instance);
        var refined = Item(1) with { ExistingStory = new string('o', 100), ImproveExisting = true };

        var result = await generator.GenerateAsync([refined, Item(2)], "en", "playful");

        Assert.Equal("mixed", result.Source);
        Assert.Equal(refined.ExistingStory, result.Suggestions[0].Story);
        Assert.True(result.Suggestions[0].Story.Length <= 1000);
        Assert.Equal(2, handler.Requests.Count);
        Assert.Contains("existingStory", handler.RequestBodies[0], StringComparison.OrdinalIgnoreCase);
        Assert.Contains("improveExisting", handler.RequestBodies[0], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Handler_RejectsRefinementThatCannotFitPersistedStoryLimit()
    {
        var handler = new GenerateNumberPegStoriesCommandHandler(new StubGenerator(), null!);
        var request = new GenerateNumberPegStoriesRequest
        {
            Items = [new NumberPegStoryItemInput
            {
                Position = 1, PegNumber = 1, PegKeyword = "candle", Word = "apple",
                ExistingStory = new string('o', 850), ImproveExisting = true
            }]
        };

        var exception = await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("user", request), default));

        Assert.Contains("under 1000", exception.Message);
    }

    private static NumberPegStoryGenerator CreateGenerator(HttpMessageHandler handler) => new(
        new HttpClient(handler),
        Options.Create(new AiTextGenerationOptions { Provider = "ollama", Model = "test-model", Endpoint = "http://localhost/api/chat" }),
        NullLogger<NumberPegStoryGenerator>.Instance);

    private static NumberPegStoryGenerationItem Item(int position = 1) => new(position, position, "candle", "one candle", "apple", null);
    private static HttpResponseMessage JsonResponse(string content) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(content, Encoding.UTF8, "application/json")
    };

    private sealed class StubGenerator : INumberPegStoryGenerator
    {
        public Task<NumberPegStoryGenerationResult> GenerateAsync(IReadOnlyList<NumberPegStoryGenerationItem> items, string locale, string style, CancellationToken cancellationToken = default) =>
            Task.FromResult(new NumberPegStoryGenerationResult([], "template"));
    }

    private sealed class QueueHttpHandler : HttpMessageHandler
    {
        private readonly Queue<Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>>> responses = new();
        public List<HttpRequestMessage> Requests { get; } = [];
        public List<string> RequestBodies { get; } = [];

        public QueueHttpHandler(params object[] responses)
        {
            foreach (var response in responses)
            {
                switch (response)
                {
                    case HttpResponseMessage message:
                        this.responses.Enqueue((_, _) => Task.FromResult(message));
                        break;
                    case Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> callback:
                        this.responses.Enqueue(callback);
                        break;
                    case Func<HttpResponseMessage> callback:
                        this.responses.Enqueue((_, _) => Task.FromResult(callback()));
                        break;
                    default:
                        throw new ArgumentException("Unsupported response callback.");
                }
            }
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            RequestBodies.Add(request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken));
            if (responses.Count == 0) throw new InvalidOperationException("Unexpected HTTP request.");
            return await responses.Dequeue()(request, cancellationToken);
        }
    }
}
