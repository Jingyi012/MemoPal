using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class PredefinedMemoryLessonEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PredefinedMemoryLessonEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Published_Catalogue_Should_Return_Only_Published_Lessons_With_Ordered_Items()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var registerResponse = await _client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Lesson Tester",
            email = $"lesson-{suffix}@example.com",
            password = "password123"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerJson = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", registerJson.GetProperty("data").GetProperty("token").GetString());

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var category = new PredefinedMemoryLessonCategory
            {
                Key = $"test-category-{suffix}",
                NameEn = "Test category",
                NameZh = "测试分类",
                DescriptionEn = "Test lessons",
                DescriptionZh = "测试课程",
                Emoji = "📚",
                IsActive = true
            };
            db.PredefinedMemoryLessons.AddRange(
                BuildLesson($"published-{suffix}", true, category),
                BuildLesson($"draft-{suffix}", false, category));
            await db.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/predefined-memory-lessons");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var lessons = json.GetProperty("data").EnumerateArray()
            .Where(x => x.GetProperty("key").GetString()!.EndsWith(suffix))
            .ToArray();

        lessons.Should().ContainSingle();
        lessons[0].GetProperty("key").GetString().Should().Be($"published-{suffix}");
        lessons[0].GetProperty("category").GetProperty("nameZh").GetString().Should().Be("测试分类");
        lessons[0].GetProperty("items")[0].GetProperty("contentZh").GetString().Should().Be("第一项");
    }

    private static PredefinedMemoryLesson BuildLesson(
        string key,
        bool isPublished,
        PredefinedMemoryLessonCategory category)
    {
        var lesson = new PredefinedMemoryLesson
        {
            Key = key,
            TitleEn = "Starter lesson",
            TitleZh = "入门课程",
            DescriptionEn = "A test lesson",
            DescriptionZh = "测试课程",
            Emoji = "🧠",
            CategoryId = category.Id,
            Category = category,
            TechniqueKey = "number-peg",
            GoalType = "ordered-list",
            SortOrder = 1,
            IsPublished = isPublished
        };
        lesson.Items.Add(new PredefinedMemoryLessonItem
        {
            LessonId = lesson.Id,
            Position = 1,
            ContentEn = "First item",
            ContentZh = "第一项"
        });
        return lesson;
    }
}
