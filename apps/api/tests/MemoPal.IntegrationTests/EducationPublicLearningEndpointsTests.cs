using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Entities;
using MemoPal.IntegrationTests.Fixtures;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationPublicLearningEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Public_course_exposes_safe_practice_content_without_creating_formal_attempts_and_revokes_immediately()
    {
        using var teacher = factory.CreateClient();
        using var learner = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(teacher);
        var learnerId = await RegisterAsync(learner);
        await RegisterAsync(stranger);

        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Public biology" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Cell structure" }));
        var assessmentId = await CreatePublishedAssessmentAsync(teacher, courseId, objective.GetProperty("id").GetString()!);
        var privateAssessmentId = await CreatePublishedAssessmentAsync(teacher, courseId, objective.GetProperty("id").GetString()!,
            "Confidential class test", isPublicPractice: false);

        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        Assert.Equal(HttpStatusCode.NotFound,
            (await learner.GetAsync($"/v1/education/public/courses/{courseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await learner.PutAsync($"/v1/education/public/courses/{courseId}/saved", null)).StatusCode);
        Assert.Empty((await DataAsync(await learner.GetAsync("/v1/education/public/practice-history"))).EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound,
            (await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/practice-check",
                new { assessmentId, questionId = "missing", answer = new { type = "true-false", booleanValue = true } })).StatusCode);

        var visible = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true }));
        Assert.True(visible.GetProperty("isPublic").GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = false })).StatusCode);

        var catalog = await DataAsync(await learner.GetAsync("/v1/education/public/courses?search=biology"));
        var listedCourse = Assert.Single(catalog.EnumerateArray());
        Assert.Equal("Public biology", listedCourse.GetProperty("title").GetString());
        Assert.Equal("Education test", listedCourse.GetProperty("authorDisplayName").GetString());
        Assert.False(listedCourse.GetProperty("isSaved").GetBoolean());
        var saved = await DataAsync(await learner.PutAsync($"/v1/education/public/courses/{courseId}/saved", null));
        Assert.True(saved.GetProperty("isSaved").GetBoolean());
        await DataAsync(await learner.PutAsync($"/v1/education/public/courses/{courseId}/saved", null));
        Assert.Contains((await DataAsync(await learner.GetAsync("/v1/education/public/saved-courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        Assert.DoesNotContain((await DataAsync(await stranger.GetAsync("/v1/education/public/saved-courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        catalog = await DataAsync(await learner.GetAsync("/v1/education/public/courses?search=biology"));
        Assert.True(Assert.Single(catalog.EnumerateArray()).GetProperty("isSaved").GetBoolean());
        var detail = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.True(detail.GetProperty("isSaved").GetBoolean());
        var strangerDetail = await DataAsync(await stranger.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.False(strangerDetail.GetProperty("isSaved").GetBoolean());
        Assert.Equal(assessmentId, Assert.Single(detail.GetProperty("assessments").EnumerateArray()).GetProperty("id").GetString());
        Assert.NotEqual(assessmentId, privateAssessmentId);
        Assert.Equal(HttpStatusCode.NotFound,
            (await learner.GetAsync($"/v1/education/public/courses/{courseId}/assessments/{privateAssessmentId}/practice")).StatusCode);

        var practice = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}/assessments/{assessmentId}/practice"));
        var question = Assert.Single(practice.GetProperty("questions").EnumerateArray()).GetProperty("question");
        Assert.Equal("Are cells the basic unit of life?", question.GetProperty("prompt").GetString());
        Assert.False(question.TryGetProperty("correctBooleanAnswer", out _));
        Assert.Equal(JsonValueKind.Null, question.GetProperty("explanation").ValueKind);

        int attemptCountBefore;
        int assignmentCountBefore;
        int publicProgressBefore;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            attemptCountBefore = await db.EducationAssessmentAttempts.CountAsync();
            assignmentCountBefore = await db.EducationAssignments.CountAsync();
            publicProgressBefore = await db.EducationPublicPracticeProgress.CountAsync();
        }
        var checkedAnswer = await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/practice-check",
            new { assessmentId, questionId = question.GetProperty("id").GetString(), answer = new { type = "true-false", booleanValue = true } }));
        Assert.True(checkedAnswer.GetProperty("isCorrect").GetBoolean());
        Assert.Equal("Cells are the basic unit of life.", checkedAnswer.GetProperty("explanation").GetString());
        var history = await DataAsync(await learner.GetAsync("/v1/education/public/practice-history"));
        var progress = Assert.Single(history.EnumerateArray());
        Assert.Equal(courseId, progress.GetProperty("courseId").GetString());
        Assert.Equal("Are cells the basic unit of life?", progress.GetProperty("questionPrompt").GetString());
        Assert.True(progress.GetProperty("lastAnswerCorrect").GetBoolean());
        Assert.False(progress.TryGetProperty("answer", out _));
        Assert.Empty((await DataAsync(await stranger.GetAsync("/v1/education/public/practice-history"))).EnumerateArray());
        await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/practice-check",
            new { assessmentId, questionId = question.GetProperty("id").GetString(), answer = new { type = "true-false", booleanValue = false } }));
        history = await DataAsync(await learner.GetAsync("/v1/education/public/practice-history"));
        Assert.False(Assert.Single(history.EnumerateArray()).GetProperty("lastAnswerCorrect").GetBoolean());
        var wrongCourseCheck = await learner.PostAsJsonAsync($"/v1/education/public/courses/{Guid.NewGuid():D}/practice-check",
            new { assessmentId, questionId = question.GetProperty("id").GetString(), answer = new { type = "true-false", booleanValue = true } });
        Assert.Equal(HttpStatusCode.NotFound, wrongCourseCheck.StatusCode);
        await DataAsync(await stranger.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/practice-check",
            new { assessmentId, questionId = question.GetProperty("id").GetString(), answer = new { type = "true-false", booleanValue = true } }));
        var clearedCount = await DataAsync(await learner.DeleteAsync("/v1/education/public/practice-history"));
        Assert.Equal(1, clearedCount.GetInt32());
        Assert.Empty((await DataAsync(await learner.GetAsync("/v1/education/public/practice-history"))).EnumerateArray());
        Assert.Single((await DataAsync(await stranger.GetAsync("/v1/education/public/practice-history"))).EnumerateArray());
        Assert.Equal(0, (await DataAsync(await learner.DeleteAsync("/v1/education/public/practice-history"))).GetInt32());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(attemptCountBefore, await db.EducationAssessmentAttempts.CountAsync());
            Assert.Equal(assignmentCountBefore, await db.EducationAssignments.CountAsync());
            Assert.Equal(publicProgressBefore + 2, await db.EducationPublicPracticeProgress.CountAsync());
            Assert.Equal(publicProgressBefore + 1, await db.EducationPublicPracticeProgress.CountAsync(progress => !progress.IsDeleted));
            var learnerProgress = await db.EducationPublicPracticeProgress.SingleAsync(progress => progress.UserId == learnerId);
            Assert.True(learnerProgress.IsDeleted);
            Assert.NotNull(learnerProgress.DeletedAt);
            Assert.Equal(learnerId, learnerProgress.DeletedBy);
        }

        await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = false }));
        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/practice-history"))).EnumerateArray(),
            item => item.GetProperty("courseId").GetString() == courseId);
        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/saved-courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        var unsaved = await DataAsync(await learner.DeleteAsync($"/v1/education/public/courses/{courseId}/saved"));
        Assert.False(unsaved.GetProperty("isSaved").GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound,
            (await learner.GetAsync($"/v1/education/public/courses/{courseId}/assessments/{assessmentId}/practice")).StatusCode);
    }

    [Fact]
    public async Task Public_course_reports_are_owner_protected_validated_and_upserted_per_reporter()
    {
        using var author = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(author);
        await RegisterAsync(learner);

        var course = await DataAsync(await author.PostAsJsonAsync("/v1/education/courses", new { title = "Reportable course" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Topic" }));
        await CreatePublishedAssessmentAsync(author, courseId, objective.GetProperty("id").GetString()!);

        var notYetPublic = await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "incorrect", details = "The explanation is wrong." });
        Assert.Equal(HttpStatusCode.NotFound, notYetPublic.StatusCode);
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true }));

        var first = await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "incorrect", details = "The explanation is wrong." }));
        var updated = await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "copyright", details = "I own the source material." }));
        Assert.Equal(first.GetProperty("id").GetString(), updated.GetProperty("id").GetString());
        Assert.Equal("copyright", updated.GetProperty("reason").GetString());
        Assert.Equal("pending", updated.GetProperty("status").GetString());

        Assert.Equal(HttpStatusCode.BadRequest,
            (await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports", new { reason = "made-up" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports", new { reason = "other", details = new string('x', 501) })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest,
            (await author.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports", new { reason = "spam" })).StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, await db.EducationCourseReports.CountAsync(x => x.CourseId == courseId));
    }

    [Fact]
    public async Task Admin_can_review_reports_and_hide_course_until_explicitly_restored()
    {
        using var author = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(author);
        await RegisterAsync(learner);
        var course = await DataAsync(await author.PostAsJsonAsync("/v1/education/courses", new { title = "Reported resource" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Topic" }));
        var assessmentId = await CreatePublishedAssessmentAsync(author, courseId, objective.GetProperty("id").GetString()!);
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true }));
        await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "incorrect", details = "Please review this explanation." }));

        Assert.Equal(HttpStatusCode.Forbidden,
            (await learner.GetAsync("/admin/education/course-reports")).StatusCode);

        using var admin = factory.CreateClient();
        var adminEmail = $"education-moderator-{Guid.NewGuid():N}@example.com";
        var adminAccount = await DataAsync(await admin.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Education moderator", email = adminEmail, password = "password123"
        }));
        var adminUserId = adminAccount.GetProperty("user").GetProperty("id").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var adminUser = await db.Users.SingleAsync(x => x.Id == adminUserId);
            adminUser.Role = MemoPal.Domain.Common.UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        var login = await DataAsync(await admin.PostAsJsonAsync("/auth/login", new { email = adminEmail, password = "password123" }));
        admin.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("token").GetString());

        var queue = await DataAsync(await admin.GetAsync("/admin/education/course-reports?pageSize=50"));
        var queueItem = Assert.Single(queue.EnumerateArray(), item => item.GetProperty("courseId").GetString() == courseId);
        var reportId = queueItem.GetProperty("reports")[0].GetProperty("id").GetString()!;
        Assert.Equal("Please review this explanation.", queueItem.GetProperty("reports")[0].GetProperty("details").GetString());
        Assert.Equal(HttpStatusCode.BadRequest,
            (await admin.PatchAsJsonAsync($"/admin/education/course-reports/{reportId}/status", new { status = "resolved", note = " " })).StatusCode);
        await DataAsync(await admin.PatchAsJsonAsync($"/admin/education/course-reports/{reportId}/status",
            new { status = "resolved", note = "Confirmed and corrected." }));
        var pendingQueue = await DataAsync(await admin.GetAsync("/admin/education/course-reports?pageSize=50"));
        Assert.DoesNotContain(pendingQueue.EnumerateArray(), item => item.GetProperty("courseId").GetString() == courseId);
        var resolvedQueue = await DataAsync(await admin.GetAsync("/admin/education/course-reports?pageSize=50&status=resolved"));
        var resolvedItem = Assert.Single(resolvedQueue.EnumerateArray(), item => item.GetProperty("courseId").GetString() == courseId);
        Assert.Equal("Confirmed and corrected.", resolvedItem.GetProperty("reports")[0].GetProperty("resolutionNote").GetString());
        var resubmitted = await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "incorrect", details = "Still needs review." }));
        Assert.Equal(reportId, resubmitted.GetProperty("id").GetString());
        Assert.Equal("pending", resubmitted.GetProperty("status").GetString());
        await DataAsync(await admin.PatchAsJsonAsync($"/admin/education/course-reports/{reportId}/status",
            new { status = "dismissed", note = "Not a policy violation." }));
        var dismissedQueue = await DataAsync(await admin.GetAsync("/admin/education/course-reports?pageSize=50&status=dismissed"));
        Assert.Equal("dismissed", Assert.Single(Assert.Single(dismissedQueue.EnumerateArray(),
            item => item.GetProperty("courseId").GetString() == courseId).GetProperty("reports").EnumerateArray())
            .GetProperty("status").GetString());
        await DataAsync(await learner.PostAsJsonAsync($"/v1/education/public/courses/{courseId}/reports",
            new { reason = "incorrect", details = "A fresh report after dismissal." }));
        Assert.Equal(HttpStatusCode.BadRequest,
            (await admin.PatchAsJsonAsync($"/admin/education/course-reports/{courseId}/hide", new { reason = " " })).StatusCode);
        await DataAsync(await admin.PatchAsJsonAsync($"/admin/education/course-reports/{courseId}/hide", new { reason = "Accuracy review" }));

        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/courses/{courseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/courses/{courseId}/assessments/{assessmentId}/practice")).StatusCode);
        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);
        Assert.DoesNotContain((await DataAsync(await learner.GetAsync("/v1/education/public/saved-courses"))).EnumerateArray(),
            item => item.GetProperty("id").GetString() == courseId);

        await DataAsync(await author.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true }));
        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/courses/{courseId}")).StatusCode);
        var hidden = await DataAsync(await admin.PatchAsync($"/admin/education/course-reports/{courseId}/restore", null));
        Assert.False(hidden.GetProperty("isModerationHidden").GetBoolean());
        Assert.Equal(HttpStatusCode.OK, (await learner.GetAsync($"/v1/education/public/courses/{courseId}")).StatusCode);
    }

    [Fact]
    public async Task Course_cannot_be_made_public_without_a_published_objective_assessment()
    {
        using var teacher = factory.CreateClient();
        await RegisterAsync(teacher);
        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Draft course" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Private topic" }));
        await CreatePublishedAssessmentAsync(teacher, courseId, objective.GetProperty("id").GetString()!,
            "Private assessment", isPublicPractice: false);
        var response = await teacher.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Public_course_recommends_only_currently_discoverable_memory_sets()
    {
        using var author = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(author);
        await RegisterAsync(learner);

        var memorySet = await DataAsync(await author.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Cell memory pegs", goalType = "facts", techniqueKey = "number-peg", status = "ready",
            visibility = "private", items = new[] { new { position = 1, prompt = "Cell", answer = "Life's building block" } },
            techniquePlan = new { schemaVersion = 1, palaceBindings = Array.Empty<object>(),
                pegBindings = new[] { new { itemPosition = 1, pegNumber = 1, sceneText = "A candle shaped like a cell", isCustomScene = false } } }
        }));
        var memorySetId = memorySet.GetProperty("id").GetString()!;
        var course = await DataAsync(await author.PostAsJsonAsync("/v1/education/courses", new { title = "Cells and memory" }));
        var courseId = course.GetProperty("id").GetString()!;

        var privateLink = await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives",
            new { title = "Cell basics", recommendedMemorySetId = memorySetId });
        Assert.Equal(HttpStatusCode.BadRequest, privateLink.StatusCode);

        await DataAsync(await author.PatchAsJsonAsync($"/v1/memory-sets/{memorySetId}/visibility", new { visibility = "public" }));
        var objective = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives",
            new { title = "Cell basics", recommendedMemorySetId = memorySetId }));
        var assessmentId = await CreatePublishedAssessmentAsync(author, courseId, objective.GetProperty("id").GetString()!);
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true }));

        var detail = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        var recommendation = Assert.Single(detail.GetProperty("objectives").EnumerateArray())
            .GetProperty("recommendedMemorySet");
        Assert.Equal(memorySetId, recommendation.GetProperty("id").GetString());
        Assert.Equal("number-peg", recommendation.GetProperty("techniqueKey").GetString());
        Assert.NotEqual(JsonValueKind.Null, detail.GetProperty("assessments")[0].ValueKind);

        Assert.Equal(HttpStatusCode.NotFound, (await learner.PutAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objective.GetProperty("id").GetString()}/memory-recommendation",
            new { recommendedMemorySetId = (string?)null })).StatusCode);
        await DataAsync(await author.PutAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objective.GetProperty("id").GetString()}/memory-recommendation",
            new { recommendedMemorySetId = (string?)null }));
        detail = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.Equal(JsonValueKind.Null, Assert.Single(detail.GetProperty("objectives").EnumerateArray())
            .GetProperty("recommendedMemorySet").ValueKind);
        await DataAsync(await author.PutAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objective.GetProperty("id").GetString()}/memory-recommendation",
            new { recommendedMemorySetId = memorySetId }));

        await DataAsync(await author.PatchAsJsonAsync($"/v1/memory-sets/{memorySetId}/visibility", new { visibility = "private" }));
        detail = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.Equal(JsonValueKind.Null, Assert.Single(detail.GetProperty("objectives").EnumerateArray())
            .GetProperty("recommendedMemorySet").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/community/memory-sets/{memorySetId}")).StatusCode);
        Assert.NotEmpty(detail.GetProperty("assessments").EnumerateArray());
        Assert.NotEmpty(assessmentId);
    }

    private static async Task<string> CreatePublishedAssessmentAsync(HttpClient client, string courseId, string objectiveId,
        string title = "Cell foundations", bool isPublicPractice = true)
    {
        var assessment = await DataAsync(await client.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var update = await DataAsync(await client.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = 1,
            title,
            questions = new[]
            {
                new { id = (string?)null, prompt = "Are cells the basic unit of life?", type = "true-false", fillMode = (string?)null,
                    maxScore = 1m, objectiveId, options = Array.Empty<object>(), correctOptionId = (string?)null,
                    correctBooleanAnswer = true, allowedTextAnswers = Array.Empty<string>(), trimTextAnswers = false,
                    ignoreCase = false, allowedNumericAnswers = Array.Empty<decimal>(), numericTolerance = 0m,
                    explanation = "Cells are the basic unit of life." }
            }
        }));
        await DataAsync(await client.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = update.GetProperty("version").GetInt32(), isPublicPractice }));
        return assessmentId;
    }

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Education test",
            email = $"education-public-{Guid.NewGuid():N}@example.com",
            password = "password123"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        return account.GetProperty("user").GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean());
        return envelope.GetProperty("data").Clone();
    }
}
