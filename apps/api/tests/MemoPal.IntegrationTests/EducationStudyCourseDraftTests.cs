using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Common;
using MemoPal.Domain.Education;
using MemoPal.IntegrationTests.Fixtures;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationStudyCourseDraftTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private const string Route = "/v1/education/course-drafts/from-study-list";

    [Fact]
    public async Task Creates_private_reviewable_lessons_and_retries_without_overwriting_edits()
    {
        using var parent = factory.CreateClient();
        using var other = factory.CreateClient();
        var owner = await Register(parent);
        await Register(other);
        var input = new { title = "School words", languageCode = "en", entries = new[] {
            new { text = "school", meaning = "学校" }, new { text = "book", meaning = "书" },
            new { text = "pencil", meaning = "铅笔" }, new { text = "pen", meaning = "钢笔" },
            new { text = "bag", meaning = "书包" }, new { text = "ruler", meaning = "ruler (answer in clue)" },
            new { text = "eraser", meaning = (string?)null } } };
        var result = await Data(await parent.PostAsJsonAsync(Route, input));
        var id = result.GetProperty("courseId").GetString()!;
        Assert.Equal(7, result.GetProperty("studyItemCount").GetInt32());
        Assert.Equal(5, result.GetProperty("practiceQuestionCount").GetInt32());
        Assert.False(result.GetProperty("alreadyExists").GetBoolean());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var course = await db.EducationCourses.Include(x => x.Objectives).ThenInclude(x => x.StudyItems)
                .Include(x => x.Assessments).ThenInclude(x => x.Questions).SingleAsync(x => x.Id == id);
            Assert.Equal(owner, course.UserId);
            Assert.False(course.IsPublic);
            Assert.Null(course.NotConfidentialExamContentConfirmedAtUtc);
            Assert.Equal(2, course.Objectives.Count);
            Assert.All(course.Objectives, objective => {
                Assert.Equal(EducationContentOrigin.Imported, objective.ContentOrigin);
                Assert.Equal(EducationContentReviewStatus.Unreviewed, objective.ReviewStatus);
                Assert.InRange(objective.StudyItems.Count, 1, 5);
                Assert.All(objective.StudyItems, item => Assert.Equal(EducationStudyItemStatus.Draft, item.Status));
            });
            var assessment = Assert.Single(course.Assessments);
            Assert.Equal(MemoPal.Domain.Entities.EducationAssessmentStatuses.Draft, assessment.Status);
            Assert.All(assessment.Questions, question => Assert.Equal("fill-blank", question.Type));
            Assert.Equal(1, await db.EducationCourseUnits.CountAsync(x => x.CourseId == id));
            course.Title = "Parent edited the course";
            await db.SaveChangesAsync();
        }
        var repeated = await Data(await parent.PostAsJsonAsync(Route, input));
        Assert.Equal(id, repeated.GetProperty("courseId").GetString());
        Assert.True(repeated.GetProperty("alreadyExists").GetBoolean());
        var otherResult = await Data(await other.PostAsJsonAsync(Route, input));
        Assert.NotEqual(id, otherResult.GetProperty("courseId").GetString());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var course = await db.EducationCourses.SingleAsync(x => x.Id == id);
            Assert.Equal("Parent edited the course", course.Title);
            course.IsDeleted = true;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Conflict, (await parent.PostAsJsonAsync(Route, input)).StatusCode);
    }

    [Fact]
    public async Task Rejects_invalid_entries_and_restricted_authors_without_creating_courses()
    {
        using var client = factory.CreateClient();
        var id = await Register(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en",
            entries = new[] { new { text = "book", meaning = "书" }, new { text = " BOOK ", meaning = "书" } } })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en", entries = Array.Empty<object>() })).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.EducationCourses.AnyAsync(x => x.UserId == id));
            (await db.Users.SingleAsync(x => x.Id == id)).AccountMode = AccountMode.RestrictedLearner;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en", entries = new[] { new { text = "book", meaning = "书" } } })).StatusCode);
    }

    private static async Task<string> Register(HttpClient client)
    {
        var data = await Data(await client.PostAsJsonAsync("/auth/register", new { displayName = "Parent", email = $"draft-{Guid.NewGuid():N}@example.com", password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.GetProperty("token").GetString());
        return data.GetProperty("user").GetProperty("id").GetString()!;
    }
    private static async Task<JsonElement> Data(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").Clone();
    }
}
