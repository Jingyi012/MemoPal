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
    public async Task Handler_RejectsNullItemBeforeSorting()
    {
        var handler = new GenerateNumberPegStoriesCommandHandler(new StubGenerator());
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
        var options = Options.Create(new PalaceAssociationGenerationOptions
        {
            Provider = "ollama",
            BatchSize = 1,
            OllamaEndpoint = "http://localhost/api/chat"
        });
        var generator = new NumberPegStoryGenerator(new HttpClient(handler), options, NullLogger<NumberPegStoryGenerator>.Instance);
        var refined = Item(1) with { ExistingStory = new string('o', 100), UserDetail = "my red scarf" };

        var result = await generator.GenerateAsync([refined, Item(2)], "en", "playful");

        Assert.Equal("mixed", result.Source);
        Assert.Contains("my red scarf", result.Suggestions[0].Story);
        Assert.True(result.Suggestions[0].Story.Length <= 1000);
        Assert.Equal(2, handler.Requests.Count);
        Assert.Contains("my red scarf", handler.RequestBodies[0]);
        Assert.Contains("existingStory", handler.RequestBodies[0], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Handler_RejectsRefinementThatCannotFitPersistedStoryLimit()
    {
        var handler = new GenerateNumberPegStoriesCommandHandler(new StubGenerator());
        var request = new GenerateNumberPegStoriesRequest
        {
            Items = [new NumberPegStoryItemInput
            {
                Position = 1, PegNumber = 1, PegKeyword = "candle", Word = "apple",
                ExistingStory = new string('o', 500), UserDetail = new string('d', 500)
            }]
        };

        var exception = await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("user", request), default));

        Assert.Contains("under 1000", exception.Message);
    }

    private static NumberPegStoryGenerator CreateGenerator(HttpMessageHandler handler) => new(
        new HttpClient(handler),
        Options.Create(new PalaceAssociationGenerationOptions { Provider = "ollama", OllamaEndpoint = "http://localhost/api/chat" }),
        NullLogger<NumberPegStoryGenerator>.Instance);

    private static NumberPegStoryGenerationItem Item(int position = 1) => new(position, position, "candle", "one candle", "apple", null, null);
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
