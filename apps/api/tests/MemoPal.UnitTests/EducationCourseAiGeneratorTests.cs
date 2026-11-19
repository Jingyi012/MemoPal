using System.Net;
using System.Text;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.AI;
using Microsoft.Extensions.Options;

namespace MemoPal.UnitTests;

public sealed class EducationCourseAiGeneratorTests
{
    [Fact]
    public async Task OpenRouterJsonResponseIsMappedAndInputIsExplicitlyUntrusted()
    {
        var transport = new StubTransport("""{"choices":[{"message":{"content":"{\"suggestions\":[{\"entryId\":\"a\",\"meaning\":\"apple\",\"needsReview\":false}],\"questions\":[]}"}}]}""");
        var generator = new EducationCourseAiGenerator(new HttpClient(transport), Options.Create(new AiTextGenerationOptions
        {
            Provider = "openrouter", Model = "fake", ApiKey = "test", Endpoint = "https://example.invalid/chat"
        }));
        var result = await generator.GenerateAsync(new("Course", "en", "zh-Hans", "basic",
            [new("unit", "Unit", [new("a", "apple", null)])]), default);
        Assert.Equal("apple", Assert.Single(result.Suggestions).Meaning);
        Assert.Contains("untrusted data", transport.Body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("entryId", transport.Body);
    }

    [Fact]
    public async Task MalformedJsonBecomesAnEmptyFailedBatchInsteadOfMockContent()
    {
        var generator = new EducationCourseAiGenerator(new HttpClient(new StubTransport("""{"choices":[{"message":{"content":"not-json"}}]}""")),
            Options.Create(new AiTextGenerationOptions { Provider = "openrouter", Model = "fake", ApiKey = "test", Endpoint = "https://example.invalid/chat" }));
        var result = await generator.GenerateAsync(new("Course", "en", "zh-Hans", "basic",
            [new("unit", "Unit", [new("a", "apple", null)])]), default);
        Assert.Empty(result.Suggestions);
        Assert.Empty(result.Questions);
        Assert.Equal(1, result.FailedBatchCount);
    }

    private sealed class StubTransport(string response) : HttpMessageHandler
    {
        public string Body { get; private set; } = "";
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new(HttpStatusCode.OK) { Content = new StringContent(response, Encoding.UTF8, "application/json") };
        }
    }
}
