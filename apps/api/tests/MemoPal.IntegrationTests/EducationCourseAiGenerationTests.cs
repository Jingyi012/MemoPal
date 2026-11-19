using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.AI;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace MemoPal.IntegrationTests;

public sealed class EducationCourseAiGenerationTests(EducationCourseAiGenerationTests.AiFactory factory) : IClassFixture<EducationCourseAiGenerationTests.AiFactory>
{
    [Fact]
    public async Task Generation_estimate_reservation_replay_and_adoption_persist_guided_questions()
    {
        factory.Provider.Reset(); factory.BatchSize = 50;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 100);
        var input = Input();
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", input));
        Assert.True(estimate.GetProperty("available").GetBoolean());
        Assert.Equal(4, estimate.GetProperty("maxCredits").GetInt32());
        Assert.Equal(100, estimate.GetProperty("availableCredits").GetInt32());

        const string requestId = "course-e2e-request";
        var payload = new { requestId, maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input };
        var overLimit = await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new { requestId, maxCredits = 2, input });
        Assert.Equal(HttpStatusCode.Conflict, overLimit.StatusCode);
        Assert.Equal(0, factory.Provider.Calls);
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", payload));
        Assert.Equal("completed", generated.GetProperty("status").GetString());
        Assert.Equal(2, generated.GetProperty("charged").GetInt32());
        Assert.Single(generated.GetProperty("output").GetProperty("suggestions").EnumerateArray());
        Assert.Equal(5, generated.GetProperty("output").GetProperty("questions").GetArrayLength());
        var vocabularyQuestion = generated.GetProperty("output").GetProperty("questions").EnumerateArray().Single(question => question.GetProperty("entryId").GetString() == "cat" && question.GetProperty("type").GetString() == "single-choice");
        Assert.Equal("What does “cat” mean?", vocabularyQuestion.GetProperty("prompt").GetString());
        Assert.Equal("“cat” means “猫”.", vocabularyQuestion.GetProperty("explanation").GetString());
        Assert.Contains(generated.GetProperty("output").GetProperty("questions").EnumerateArray(), question => question.GetProperty("type").GetString() == "matching");
        Assert.Equal(1, factory.Provider.Calls);
        var recovered = await Data(await owner.GetAsync($"/v1/education/course-drafts/generations/{requestId}"));
        Assert.Equal(generated.GetProperty("generationId").GetString(), recovered.GetProperty("generationId").GetString());
        Assert.Equal("completed", recovered.GetProperty("status").GetString());
        using (var stranger = factory.CreateClient())
        {
            await Register(stranger);
            Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/education/course-drafts/generations/{requestId}")).StatusCode);
        }
        var replay = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", payload));
        Assert.Equal(generated.GetProperty("generationId").GetString(), replay.GetProperty("generationId").GetString());
        Assert.Equal(1, factory.Provider.Calls);
        await using (var scope = factory.Services.CreateAsyncScope())
            Assert.Equal(98, (await scope.ServiceProvider.GetRequiredService<IAiCredits>().BalanceAsync(userId, default)).Available);

        var adopted = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            generationId = generated.GetProperty("generationId").GetString(), startLearning = true,
            confirmedSuggestionIds = new[] { "cat" }, includedQuestionIndexes = new[] { 0, 1 },
            units = new[] { new { stableId = "unit-a", title = "Animals", entries = new[]
            {
                new { stableId = "cat", text = "cat", meaning = "猫" }, new { stableId = "dog", text = "dog", meaning = "狗" },
                new { stableId = "sun", text = "sun", meaning = "太阳" }
            } } }
        }));
        Assert.Equal(2, adopted.GetProperty("practiceQuestionCount").GetInt32());
        var retry = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            generationId = generated.GetProperty("generationId").GetString(), startLearning = true,
            confirmedSuggestionIds = new[] { "cat" }, includedQuestionIndexes = new[] { 0, 1 },
            units = new[] { new { stableId = "unit-a", title = "Animals", entries = new[]
            {
                new { stableId = "cat", text = "cat", meaning = "猫" }, new { stableId = "dog", text = "dog", meaning = "狗" },
                new { stableId = "sun", text = "sun", meaning = "太阳" }
            } } }
        }));
        Assert.Equal(adopted.GetProperty("courseId").GetString(), retry.GetProperty("courseId").GetString());
        Assert.True(retry.GetProperty("alreadyExists").GetBoolean());
        var detail = await Data(await owner.GetAsync($"/v1/education/my-courses/{adopted.GetProperty("courseId").GetString()}"));
        var assessmentId = detail.GetProperty("units")[0].GetProperty("assessmentId").GetString()!;
        var session = await Data(await owner.PostAsync($"/v1/education/guided/courses/{adopted.GetProperty("courseId").GetString()}/assessments/{assessmentId}/sessions", null));
        Assert.Equal(2, session.GetProperty("questions").GetArrayLength());
        Assert.Contains(session.GetProperty("questions").EnumerateArray(), question => question.GetProperty("question").GetProperty("type").GetString() == "matching");
        var omittedIndexesRetry = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            generationId = generated.GetProperty("generationId").GetString(), startLearning = true,
            confirmedSuggestionIds = new[] { "cat" },
            units = new[] { new { stableId = "unit-a", title = "Animals", entries = new[]
            {
                new { stableId = "cat", text = "cat", meaning = "猫" }, new { stableId = "dog", text = "dog", meaning = "狗" },
                new { stableId = "sun", text = "sun", meaning = "太阳" }
            } } }
        }));
        // Omitting selection adopts the full expanded question set, rather than the two-question subset.
        Assert.NotEqual(adopted.GetProperty("courseId").GetString(), omittedIndexesRetry.GetProperty("courseId").GetString());
        Assert.Equal(5, omittedIndexesRetry.GetProperty("practiceQuestionCount").GetInt32());
        var withoutQuestions = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            generationId = generated.GetProperty("generationId").GetString(), startLearning = true,
            confirmedSuggestionIds = new[] { "cat" }, includedQuestionIndexes = Array.Empty<int>(),
            units = new[] { new { stableId = "unit-a", title = "Animals", entries = new[]
            {
                new { stableId = "cat", text = "cat", meaning = "猫" }, new { stableId = "dog", text = "dog", meaning = "狗" },
                new { stableId = "sun", text = "sun", meaning = "太阳" }
            } } }
        }));
        Assert.NotEqual(adopted.GetProperty("courseId").GetString(), withoutQuestions.GetProperty("courseId").GetString());
        Assert.Equal(0, withoutQuestions.GetProperty("practiceQuestionCount").GetInt32());
    }

    [Fact]
    public async Task Failed_provider_batch_returns_partial_rules_and_charges_only_successful_suggestions()
    {
        factory.Provider.Reset(); factory.Provider.FailAtCall = 2; factory.BatchSize = 1;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 20);
        var input = new { title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            units = new[] { new { id = "unit-a", title = "Animals", entries = new[]
            {
                new { id = "cat", text = "cat", meaning = (string?)null }, new { id = "dog", text = "dog", meaning = "狗" }
            } } } };
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", input));
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "partial-course-request", maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input }));
        Assert.Equal("partial", generated.GetProperty("status").GetString());
        Assert.Equal(1, generated.GetProperty("charged").GetInt32());
        Assert.Single(generated.GetProperty("output").GetProperty("suggestions").EnumerateArray());
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Equal(19, (await scope.ServiceProvider.GetRequiredService<IAiCredits>().BalanceAsync(userId, default)).Available);
    }

    [Fact]
    public async Task Repeated_source_word_meaning_is_review_only_and_not_charged_as_a_success()
    {
        factory.Provider.Reset(); factory.BatchSize = 50;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 5);
        var input = new { title = "Words", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            units = new[] { new { id = "unit-a", title = "Words", entries = new[] { new { id = "book", text = "book", meaning = (string?)null } } } } };
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", input));
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "repeated-book-request", maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input }));
        Assert.Equal("partial", generated.GetProperty("status").GetString());
        Assert.Equal(0, generated.GetProperty("charged").GetInt32());
        Assert.Empty(generated.GetProperty("output").GetProperty("questions").EnumerateArray());
        Assert.True(generated.GetProperty("output").GetProperty("suggestions")[0].GetProperty("needsReview").GetBoolean());
        var invalidAdoption = await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Words", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            generationId = generated.GetProperty("generationId").GetString(), confirmedSuggestionIds = new[] { "book" },
            includedQuestionIndexes = Array.Empty<int>(),
            units = new[] { new { stableId = "unit-a", title = "Words", entries = new[] { new { stableId = "book", text = "book", meaning = "book" } } } }
        });
        Assert.Equal(HttpStatusCode.Conflict, invalidAdoption.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.Equal(5, (await scope.ServiceProvider.GetRequiredService<IAiCredits>().BalanceAsync(userId, default)).Available);
    }

    [Fact]
    public async Task Concept_explicit_negation_is_adopted_as_true_false_but_conditionals_are_not()
    {
        factory.Provider.Reset(); factory.BatchSize = 50;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 20);
        var sourceInput = new { title = "种子", languageCode = "zh-Hans", meaningLanguageCode = "zh-Hans", difficulty = "basic", contentType = "ConceptUnderstanding",
            units = new[] { new { id = "unit-seed", title = "种子", entries = new[] {
                new { id = "seed", text = "种子萌发", meaning = "种子萌发不需要土壤。" },
                new { id = "evaporation", text = "蒸发", meaning = "蒸发是液态水变成水蒸气。" }
            } } } };
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", sourceInput));
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "concept-negation-source", maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input = sourceInput }));
        var outputQuestions = generated.GetProperty("output").GetProperty("questions").EnumerateArray().ToArray();
        var question = Assert.Single(outputQuestions.Where(item => item.GetProperty("type").GetString() == "true-false"));
        Assert.Equal("true-false", question.GetProperty("type").GetString());
        Assert.Equal("根据原文，判断这句话是否正确：“种子萌发需要土壤。”", question.GetProperty("prompt").GetString());
        Assert.False(question.GetProperty("correctBooleanAnswer").GetBoolean());
        Assert.Equal("原文：“种子萌发不需要土壤。”", question.GetProperty("explanation").GetString());
        var conceptRecall = Assert.Single(outputQuestions.Where(item => item.GetProperty("type").GetString() == "fill-blank"));
        Assert.Contains("____", conceptRecall.GetProperty("prompt").GetString());
        Assert.DoesNotContain("蒸发", conceptRecall.GetProperty("prompt").GetString(), StringComparison.Ordinal);
        var adopted = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "种子", languageCode = "zh-Hans", meaningLanguageCode = "zh-Hans", difficulty = "basic", memoryContentType = "ConceptUnderstanding", generationId = generated.GetProperty("generationId").GetString(),
            includedQuestionIndexes = new[] { 0, 1 }, startLearning = true,
            units = new[] { new { stableId = "unit-seed", title = "种子", entries = new[] {
                new { stableId = "seed", text = "种子萌发", meaning = "种子萌发不需要土壤。" },
                new { stableId = "evaporation", text = "蒸发", meaning = "蒸发是液态水变成水蒸气。" }
            } } }
        }));
        var course = await Data(await owner.GetAsync($"/v1/education/my-courses/{adopted.GetProperty("courseId").GetString()}"));
        var assessmentId = course.GetProperty("units")[0].GetProperty("assessmentId").GetString()!;
        var session = await Data(await owner.PostAsync($"/v1/education/guided/courses/{adopted.GetProperty("courseId").GetString()}/assessments/{assessmentId}/sessions", null));
        Assert.Contains(session.GetProperty("questions").EnumerateArray(), item => item.GetProperty("question").GetProperty("type").GetString() == "true-false");

        var conditionalInput = new { title = "种子条件", languageCode = "zh-Hans", meaningLanguageCode = "zh-Hans", difficulty = "basic", contentType = "ConceptUnderstanding",
            units = new[] { new { id = "unit-condition", title = "种子", entries = new[] { new { id = "conditional-seed", text = "种子萌发", meaning = "种子萌发如果没有土壤，也可以发生。" } } } } };
        var conditionalEstimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", conditionalInput));
        var conditional = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "concept-condition-source", maxCredits = conditionalEstimate.GetProperty("maxCredits").GetInt32(), input = conditionalInput }));
        Assert.DoesNotContain(conditional.GetProperty("output").GetProperty("questions").EnumerateArray(), item => item.GetProperty("type").GetString() == "true-false");
    }

    [Fact]
    public async Task Verbatim_ordering_adoption_preserves_source_whitespace_and_ai_meaning_explanations_are_labeled()
    {
        factory.Provider.Reset(); factory.BatchSize = 50;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 20);
        var input = new { title = "Sentence", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic", contentType = "VerbatimText",
            units = new[] { new { id = "unit-sentence", title = "Sentence", entries = new[] { new { id = "sentence", text = "Plants  need sunlight to grow.", meaning = (string?)null } } } } };
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", input));
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "verbatim-double-space", maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input }));
        var ordering = Assert.Single(generated.GetProperty("output").GetProperty("questions").EnumerateArray());
        Assert.Equal("ordering", ordering.GetProperty("type").GetString());
        Assert.Equal("Original sentence: “Plants  need sunlight to grow.”", ordering.GetProperty("explanation").GetString());
        var adopted = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = "Sentence", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic", memoryContentType = "VerbatimText", generationId = generated.GetProperty("generationId").GetString(),
            includedQuestionIndexes = new[] { 0 }, startLearning = true,
            units = new[] { new { stableId = "unit-sentence", title = "Sentence", entries = new[] { new { stableId = "sentence", text = "Plants  need sunlight to grow.", meaning = (string?)null } } } }
        }));
        Assert.Equal(1, adopted.GetProperty("practiceQuestionCount").GetInt32());
        var course = await Data(await owner.GetAsync($"/v1/education/my-courses/{adopted.GetProperty("courseId").GetString()}"));
        var assessmentId = course.GetProperty("units")[0].GetProperty("assessmentId").GetString()!;
        var session = await Data(await owner.PostAsync($"/v1/education/guided/courses/{adopted.GetProperty("courseId").GetString()}/assessments/{assessmentId}/sessions", null));
        Assert.Equal("ordering", session.GetProperty("questions")[0].GetProperty("question").GetProperty("type").GetString());

        var chineseInput = new { title = "植物句子", languageCode = "zh-Hans", meaningLanguageCode = "zh-Hans", difficulty = "basic", contentType = "VerbatimText",
            units = new[] { new { id = "unit-cn", title = "植物", entries = new[] { new { id = "cn-sentence", text = "植物需要阳光才能生长。", meaning = "植物生长需要光照。" } } } } };
        var chineseEstimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", chineseInput));
        var chinese = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "verbatim-chinese-clue", maxCredits = chineseEstimate.GetProperty("maxCredits").GetInt32(), input = chineseInput }));
        var restore = Assert.Single(chinese.GetProperty("output").GetProperty("questions").EnumerateArray());
        Assert.Equal("fill-blank", restore.GetProperty("type").GetString());
        Assert.Equal("植物需要阳光才能生长。", restore.GetProperty("answer").GetString());
        Assert.DoesNotContain("植物需要阳光才能生长。", restore.GetProperty("prompt").GetString(), StringComparison.Ordinal);

        var conceptInput = new { title = "Concept", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic", contentType = "ConceptUnderstanding",
            units = new[] { new { id = "unit-cat", title = "Concept", entries = new[] { new { id = "cat", text = "cat", meaning = (string?)null } } } } };
        var conceptEstimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", conceptInput));
        var concept = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = "concept-ai-origin-label", maxCredits = conceptEstimate.GetProperty("maxCredits").GetInt32(), input = conceptInput }));
        Assert.Contains(concept.GetProperty("output").GetProperty("questions").EnumerateArray(), item =>
            item.GetProperty("type").GetString() == "fill-blank" && item.GetProperty("explanation").GetString()!.Contains("AI suggested", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(4, 5)]
    [InlineData(10, 8)]
    public async Task Matching_does_not_replace_individual_recall_and_free_questions_obey_unit_limit(int entryCount, int expectedQuestions)
    {
        factory.Provider.Reset(); factory.BatchSize = 50;
        using var owner = factory.CreateClient();
        var userId = await Register(owner);
        await Grant(factory, userId, 20);
        var entries = Enumerable.Range(0, entryCount).Select(index => new { id = $"entry-{index}", text = $"word-{index}", meaning = $"意思{index}" }).ToArray();
        var input = new { title = "Recall practice", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
            units = new[] { new { id = "unit-recall", title = "Recall", entries } } };
        var estimate = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generation-estimate", input));
        var generated = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/generate", new
        { requestId = $"recall-{entryCount}", maxCredits = estimate.GetProperty("maxCredits").GetInt32(), input }));
        var questions = generated.GetProperty("output").GetProperty("questions").EnumerateArray().ToArray();
        Assert.Equal(expectedQuestions, questions.Length);
        Assert.Single(questions.Where(question => question.GetProperty("type").GetString() == "matching"));
        var recall = questions.Where(question => question.GetProperty("type").GetString() == "fill-blank").ToArray();
        Assert.Equal(expectedQuestions - 1, recall.Length);
        Assert.Equal(recall.Length, recall.Select(question => question.GetProperty("entryId").GetString()).Distinct().Count());
        Assert.Equal(0, generated.GetProperty("charged").GetInt32());
        var adopted = await Data(await owner.PostAsJsonAsync("/v1/education/course-drafts/from-study-list", new
        {
            title = input.title, languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic", startLearning = true,
            generationId = generated.GetProperty("generationId").GetString(),
            units = new[] { new { stableId = "unit-recall", title = "Recall", entries = entries.Select(entry => new { stableId = entry.id, entry.text, entry.meaning }).ToArray() } }
        }));
        Assert.Equal(expectedQuestions, adopted.GetProperty("practiceQuestionCount").GetInt32());
        var course = await Data(await owner.GetAsync($"/v1/education/my-courses/{adopted.GetProperty("courseId").GetString()}"));
        var assessmentId = course.GetProperty("units")[0].GetProperty("assessmentId").GetString()!;
        var session = await Data(await owner.PostAsync($"/v1/education/guided/courses/{adopted.GetProperty("courseId").GetString()}/assessments/{assessmentId}/sessions", null));
        Assert.Equal(expectedQuestions, session.GetProperty("questions").GetArrayLength());
    }

    private static object Input() => new { title = "Animals", languageCode = "en", meaningLanguageCode = "zh-Hans", difficulty = "basic",
        units = new[] { new { id = "unit-a", title = "Animals", entries = new[]
        {
            new { id = "cat", text = "cat", meaning = (string?)null }, new { id = "dog", text = "dog", meaning = "狗" }, new { id = "sun", text = "sun", meaning = "太阳" }
        } } } };

    private static async Task<string> Register(HttpClient client)
    {
        var response = await Data(await client.PostAsJsonAsync("/auth/register", new { displayName = "Parent", email = $"course-ai-{Guid.NewGuid():N}@example.com", password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", response.GetProperty("token").GetString());
        return response.GetProperty("user").GetProperty("id").GetString()!;
    }

    private static async Task Grant(AiFactory factory, string userId, int amount)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<IAiCredits>().GrantAsync(userId, Guid.NewGuid().ToString("N"), "manual", amount, null, default);
    }

    private static async Task<JsonElement> Data(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode) throw new HttpRequestException($"Request failed with {(int)response.StatusCode}: {content}");
        using var document = JsonDocument.Parse(content);
        return document.RootElement.GetProperty("data").Clone();
    }

    public sealed class AiFactory : CustomWebApplicationFactory
    {
        public FakeProvider Provider { get; } = new();
        private AiTextGenerationOptions settings = new() { Provider = "openrouter", Model = "fake", ApiKey = "fake-key", Endpoint = "https://education.example.test/v1/chat/completions", BatchSize = 50 };
        public int BatchSize { get => settings.BatchSize; set => settings.BatchSize = value; }
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IOptions<AiTextGenerationOptions>>();
                services.AddSingleton<IOptions<AiTextGenerationOptions>>(Options.Create(settings));
                services.RemoveAll<IEducationCourseAiGenerator>();
                services.AddTransient<IEducationCourseAiGenerator>(_ => new EducationCourseAiGenerator(new HttpClient(Provider, disposeHandler: false), Options.Create(settings)));
            });
        }
    }

    public sealed class FakeProvider : HttpMessageHandler
    {
        private const string Content = """{"suggestions":[{"entryId":"cat","meaning":"猫","needsReview":false}],"questions":[{"unitId":"unit-a","entryId":"cat","prompt":"What does cat mean?","type":"single-choice","options":["猫","狗"],"correctOptionIndex":0,"answer":null,"explanation":"Cat means 猫."}]}""";
        public int Calls { get; private set; }
        public int FailAtCall { get; set; }
        public void Reset() { Calls = 0; FailAtCall = 0; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal("https://education.example.test/v1/chat/completions", request.RequestUri!.AbsoluteUri);
            var body = await request.Content!.ReadAsStringAsync(cancellationToken);
            Calls++;
            if (Calls == FailAtCall) return new(HttpStatusCode.ServiceUnavailable);
            using var envelope = JsonDocument.Parse(body);
            var prompt = envelope.RootElement.GetProperty("messages")[0].GetProperty("content").GetString()!;
            var includesCat = prompt.Contains("\"id\":\"cat\"", StringComparison.Ordinal);
            var includesDog = prompt.Contains("\"id\":\"dog\"", StringComparison.Ordinal);
            var includesBook = prompt.Contains("\"id\":\"book\"", StringComparison.Ordinal);
            var content = includesCat ? Content : """{"suggestions":[],"questions":[]}""";
            if (includesBook) content = """{"suggestions":[{"entryId":"book","meaning":"book","needsReview":false}],"questions":[]}""";
            if (includesCat && !includesDog)
                content = """{"suggestions":[{"entryId":"cat","meaning":"猫","needsReview":false}],"questions":[]}""";
            var response = JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } });
            return new(HttpStatusCode.OK) { Content = new StringContent(response, Encoding.UTF8, "application/json") };
        }
    }
}
