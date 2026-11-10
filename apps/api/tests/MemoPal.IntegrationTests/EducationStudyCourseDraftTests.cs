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
            Assert.Single(course.Objectives);
            Assert.All(course.Objectives, objective => {
                Assert.Equal(EducationContentOrigin.Imported, objective.ContentOrigin);
                Assert.Equal(EducationContentReviewStatus.Unreviewed, objective.ReviewStatus);
                Assert.Equal(7, objective.StudyItems.Count);
                Assert.Equal(Enumerable.Range(1, 7), objective.StudyItems.OrderBy(x => x.Position).Select(x => x.Position));
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

    [Theory]
    [InlineData(1, 7)]
    [InlineData(3, 3)]
    [InlineData(10, 1)]
    public async Task Requested_group_size_creates_real_units_and_preserves_all_entries(int groupSize, int expectedUnits)
    {
        using var client = factory.CreateClient();
        await Register(client);
        var entries = Enumerable.Range(1, 7).Select(i => new { text = $"word-{i}", meaning = $"clue-{i}" }).ToArray();
        var input = new { title = "Grouped words", languageCode = "en", entries, groupSize };
        var created = await Data(await client.PostAsJsonAsync(Route, input));
        var courseId = created.GetProperty("courseId").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var units = await db.EducationCourseUnits.Where(x => x.CourseId == courseId).OrderBy(x => x.Position).ToListAsync();
            Assert.Equal(expectedUnits, units.Count);
            var objectives = await db.EducationObjectives.Where(x => x.CourseId == courseId).Include(x => x.StudyItems).ToListAsync();
            Assert.Equal(7, objectives.Sum(x => x.StudyItems.Count));
            foreach (var (unit, index) in units.Select((unit, index) => (unit, index)))
            {
                var objective = Assert.Single(objectives, x => x.UnitId == unit.Id);
                Assert.Equal(index, unit.Position);
                Assert.Equal(0, objective.UnitPosition);
                var items = objective.StudyItems.OrderBy(x => x.Position).ToArray();
                Assert.Equal(Enumerable.Range(1, items.Length), items.Select(x => x.Position));
                Assert.Equal(entries.Skip(index * groupSize).Take(groupSize).Select(x => x.text), items.Select(x => x.Primary));
                Assert.Equal(items.Length, await db.EducationQuestions.CountAsync(x => x.ObjectiveId == objective.Id));
            }
        }
        var retry = await Data(await client.PostAsJsonAsync(Route, input));
        Assert.Equal(courseId, retry.GetProperty("courseId").GetString());
        Assert.True(retry.GetProperty("alreadyExists").GetBoolean());
        var together = await Data(await client.PostAsJsonAsync(Route, new { input.title, input.languageCode, entries }));
        if (groupSize < entries.Length) Assert.NotEqual(courseId, together.GetProperty("courseId").GetString());
        else Assert.Equal(courseId, together.GetProperty("courseId").GetString());
    }

    [Fact]
    public async Task Named_units_preserve_titles_membership_order_and_retry_identity()
    {
        using var client = factory.CreateClient();
        await Register(client);
        var first = new { title = "Directions", entries = new[] { new { text = "North", meaning = "北" }, new { text = "South", meaning = "南" } } };
        var second = new { title = "Up and down", entries = new[] { new { text = "Up", meaning = "上" } } };
        var input = new { title = "Earth", languageCode = "en", units = new[] { first, second } };
        var created = await Data(await client.PostAsJsonAsync(Route, input));
        var courseId = created.GetProperty("courseId").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var units = await db.EducationCourseUnits.Where(x => x.CourseId == courseId).OrderBy(x => x.Position).ToListAsync();
            Assert.Equal(new[] { "Directions", "Up and down" }, units.Select(x => x.Title));
            var objectives = await db.EducationObjectives.Where(x => x.CourseId == courseId).Include(x => x.StudyItems).ToListAsync();
            Assert.Equal(new[] { "North", "South" }, Assert.Single(objectives, x => x.UnitId == units[0].Id).StudyItems.OrderBy(x => x.Position).Select(x => x.Primary));
            Assert.Equal("Up", Assert.Single(Assert.Single(objectives, x => x.UnitId == units[1].Id).StudyItems).Primary);
        }
        var retry = await Data(await client.PostAsJsonAsync(Route, input));
        Assert.Equal(courseId, retry.GetProperty("courseId").GetString());
        Assert.True(retry.GetProperty("alreadyExists").GetBoolean());
        var reordered = await Data(await client.PostAsJsonAsync(Route, new { input.title, input.languageCode, units = new[] { second, first } }));
        Assert.NotEqual(courseId, reordered.GetProperty("courseId").GetString());
        var renamed = await Data(await client.PostAsJsonAsync(Route, new { input.title, input.languageCode, units = new[] { new { title = "Renamed", first.entries }, second } }));
        Assert.NotEqual(courseId, renamed.GetProperty("courseId").GetString());
    }

    [Fact]
    public async Task Named_units_reject_empty_duplicate_oversized_and_ambiguous_content()
    {
        using var client = factory.CreateClient();
        var owner = await Register(client);
        var word = new { text = "book", meaning = "书" };
        object[] invalid = [
            new { title = "Words", languageCode = "en", units = Array.Empty<object>() },
            new { title = "Words", languageCode = "en", units = new[] { new { title = "Empty", entries = Array.Empty<object>() } } },
            new { title = "Words", languageCode = "en", units = new[] { new { title = " ", entries = new[] { word } } } },
            new { title = "Words", languageCode = "en", units = new[] { new { title = "Unit", entries = new[] { word, word } } } },
            new { title = "Words", languageCode = "en", units = new[] { new { title = "Unit", entries = Enumerable.Range(1, 51).Select(i => new { text = $"word-{i}", meaning = "clue" }).ToArray() } } },
            new { title = "Words", languageCode = "en", entries = new[] { word }, units = new[] { new { title = "Unit", entries = new[] { word } } } }
        ];
        foreach (var input in invalid) Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, input)).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        Assert.False(await scope.ServiceProvider.GetRequiredService<AppDbContext>().EducationCourses.AnyAsync(x => x.UserId == owner));
    }

    [Fact]
    public async Task Rejects_invalid_entries_and_restricted_authors_without_creating_courses()
    {
        using var client = factory.CreateClient();
        var id = await Register(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en",
            entries = new[] { new { text = "book", meaning = "书" }, new { text = " BOOK ", meaning = "书" } } })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en", entries = Array.Empty<object>() })).StatusCode);
        foreach (var size in new[] { 0, -1, 51 })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en", groupSize = size,
                entries = new[] { new { text = "book", meaning = "书" } } })).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.EducationCourses.AnyAsync(x => x.UserId == id));
            (await db.Users.SingleAsync(x => x.Id == id)).AccountMode = AccountMode.RestrictedLearner;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync(Route, new { title = "Words", languageCode = "en", entries = new[] { new { text = "book", meaning = "书" } } })).StatusCode);
    }

    [Fact]
    public async Task Private_content_can_start_immediately_without_publication_and_only_owner_can_learn()
    {
        using var owner = factory.CreateClient(); using var stranger = factory.CreateClient();
        await Register(owner); await Register(stranger);
        var payload = new { title = "Private spelling", languageCode = "en", startLearning = true,
            units = new[] { new { title = "School", entries = new[] { new { text = "book", meaning = "书" } } } } };
        var result = await Data(await owner.PostAsJsonAsync(Route, payload));
        var id = result.GetProperty("courseId").GetString()!;
        Assert.True(result.GetProperty("readyToLearn").GetBoolean());
        var detail = await Data(await owner.GetAsync($"/v1/education/my-courses/{id}"));
        var unit = detail.GetProperty("units")[0];
        Assert.True(detail.GetProperty("readyToLearn").GetBoolean());
        Assert.Equal("book", unit.GetProperty("studyItems")[0].GetProperty("primary").GetString());
        var assessmentId = unit.GetProperty("assessmentId").GetString()!;
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/education/my-courses/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/v1/education/public/courses/{id}")).StatusCode);
        var publicList = await Data(await stranger.GetAsync("/v1/education/public/courses"));
        Assert.DoesNotContain(publicList.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        var privateList = await Data(await owner.GetAsync("/v1/education/my-courses"));
        Assert.Contains(privateList.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        var path = $"/v1/education/guided/courses/{id}/assessments/{assessmentId}/sessions";
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsync(path, null)).StatusCode);
        var session = await Data(await owner.PostAsync(path, null));
        var sid = session.GetProperty("sessionId").GetString()!;
        var qid = session.GetProperty("questions")[0].GetProperty("question").GetProperty("id").GetString()!;
        var checkedAnswer = await Data(await owner.PostAsJsonAsync($"/v1/education/guided/sessions/{sid}/questions/{qid}/check",
            new { requestId = "private-once", expectedVersion = 1, answer = new { type = "text", textValue = "book" } }));
        Assert.True(checkedAnswer.GetProperty("isCorrect").GetBoolean());
        Assert.True(checkedAnswer.GetProperty("isComplete").GetBoolean());
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var course = await db.EducationCourses.SingleAsync(x => x.Id == id);
        Assert.False(course.IsPublic); Assert.Null(course.PubliclyPublishedAt);
        Assert.False((await db.EducationAssessments.SingleAsync(x => x.Id == assessmentId)).IsPublicPractice);
        var retry = await Data(await owner.PostAsJsonAsync(Route, payload));
        Assert.Equal(id, retry.GetProperty("courseId").GetString());
    }

    [Fact]
    public async Task Saved_drafts_reopen_and_promote_in_place_without_becoming_public()
    {
        using var owner = factory.CreateClient(); await Register(owner);
        var units = new[] { new { title = "Words", entries = new[] { new { text = "hello", meaning = (string?)null } } } };
        var draft = await Data(await owner.PostAsJsonAsync(Route, new { title = "Personal", languageCode = "en", units }));
        var id = draft.GetProperty("courseId").GetString()!;
        Assert.False(draft.GetProperty("readyToLearn").GetBoolean());
        var detail = await Data(await owner.GetAsync($"/v1/education/my-courses/{id}"));
        Assert.False(detail.GetProperty("readyToLearn").GetBoolean());
        var input = new { title = "Personal", languageCode = "en", units, sourceDraftId = id, startLearning = true };
        var ready = await Data(await owner.PostAsJsonAsync(Route, input));
        Assert.Equal(id, ready.GetProperty("courseId").GetString());
        Assert.True(ready.GetProperty("readyToLearn").GetBoolean());
        var retry = await Data(await owner.PostAsJsonAsync(Route, input));
        Assert.Equal(id, retry.GetProperty("courseId").GetString());
        var loaded = await Data(await owner.GetAsync($"/v1/education/my-courses/{id}"));
        Assert.True(loaded.GetProperty("readyToLearn").GetBoolean());
        Assert.Equal(JsonValueKind.Null, loaded.GetProperty("units")[0].GetProperty("assessmentId").ValueKind);
    }

    [Fact]
    public async Task Editing_a_draft_replaces_its_list_entry_but_preserves_ready_courses_and_ownership()
    {
        using var owner = factory.CreateClient(); using var stranger = factory.CreateClient();
        await Register(owner); await Register(stranger);
        var entries = new[] { new { text = "word", meaning = (string?)null } };
        var draft = await Data(await owner.PostAsJsonAsync(Route, new { title = "Draft", languageCode = "en", entries }));
        var id = draft.GetProperty("courseId").GetString()!;
        var editedInput = new { title = "Edited draft", languageCode = "en", entries, sourceDraftId = id };
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(Route, editedInput)).StatusCode);
        var edited = await Data(await owner.PostAsJsonAsync(Route, editedInput));
        var editedId = edited.GetProperty("courseId").GetString()!;
        var list = await Data(await owner.GetAsync("/v1/education/my-courses"));
        Assert.DoesNotContain(list.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        Assert.Contains(list.EnumerateArray(), x => x.GetProperty("id").GetString() == editedId);
        var retry = await Data(await owner.PostAsJsonAsync(Route, editedInput));
        Assert.Equal(editedId, retry.GetProperty("courseId").GetString());
        await Data(await owner.PostAsJsonAsync(Route, new { title = "Edited draft", languageCode = "en", entries, sourceDraftId = editedId, startLearning = true }));
        Assert.Equal(HttpStatusCode.Conflict, (await owner.PostAsJsonAsync(Route, new { title = "Replace ready", languageCode = "en", entries, sourceDraftId = editedId })).StatusCode);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Owner_can_delete_private_content_idempotently_without_exposing_or_erasing_its_children(bool ready)
    {
        using var owner = factory.CreateClient(); using var other = factory.CreateClient();
        await Register(owner); await Register(other);
        var created = await Data(await owner.PostAsJsonAsync(Route, new {
            title = "Remove my spelling", languageCode = "en", startLearning = ready,
            entries = new[] { new { text = "book", meaning = "书" } }
        }));
        var id = created.GetProperty("courseId").GetString()!;
        var path = $"/v1/education/my-courses/{id}";
        var detail = await Data(await owner.GetAsync(path));
        var assessment = detail.GetProperty("units")[0].GetProperty("assessmentId").GetString();
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(path)).StatusCode);
        Assert.True((await Data(await owner.DeleteAsync(path))).GetBoolean());
        Assert.True((await Data(await owner.DeleteAsync(path))).GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(path)).StatusCode);
        var list = await Data(await owner.GetAsync("/v1/education/my-courses"));
        Assert.DoesNotContain(list.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        if (assessment is not null)
            Assert.Equal(HttpStatusCode.NotFound, (await owner.PostAsync($"/v1/education/guided/courses/{id}/assessments/{assessment}/sessions", null)).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True((await db.EducationCourses.IgnoreQueryFilters().SingleAsync(x => x.Id == id)).IsDeleted);
        Assert.True(await db.EducationObjectives.AnyAsync(x => x.CourseId == id));
        Assert.True(await db.EducationQuestions.AnyAsync(x => x.Assessment!.CourseId == id));
    }

    [Fact]
    public async Task Personal_delete_does_not_remove_general_authored_courses_or_unknown_content()
    {
        using var owner = factory.CreateClient(); await Register(owner);
        var created = await Data(await owner.PostAsJsonAsync("/v1/education/courses", new { title = "Author workspace" }));
        var id = created.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.NotFound, (await owner.DeleteAsync($"/v1/education/my-courses/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.DeleteAsync("/v1/education/my-courses/import-missing")).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False((await db.EducationCourses.SingleAsync(x => x.Id == id)).IsDeleted);
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
