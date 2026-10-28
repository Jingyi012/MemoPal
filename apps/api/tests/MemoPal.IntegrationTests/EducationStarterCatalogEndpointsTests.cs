using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Api.Security;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationStarterCatalogEndpointsTests(StarterCatalogWebApplicationFactory factory)
    : IClassFixture<StarterCatalogWebApplicationFactory>
{
    [Fact]
    public async Task DefaultStarterCatalogIsReadyForAnOrdinaryUserWithoutClassOrMemoryData()
    {
        using var client = factory.CreateClient();
        var userId = await RegisterAsync(client);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Empty(await db.EducationMemberships.Where(item => item.UserId == userId).ToListAsync());
            Assert.Empty(await db.MemorySets.Where(item => item.UserId == userId).ToListAsync());
            Assert.Empty(await db.EducationAssignmentRecipients.Where(item => item.StudentUserId == userId).ToListAsync());
        }

        using var catalog = await DataAsync(await client.GetAsync("/v1/education/public/courses"));
        var english = catalog.RootElement.EnumerateArray().Single(course =>
            course.GetProperty("id").GetString() == "system-starter-english-requests-v1");
        Assert.True(english.GetProperty("isMemoPalStarter").GetBoolean());
        Assert.Equal("MemoPal", english.GetProperty("authorDisplayName").GetString());
        var courseId = english.GetProperty("id").GetString()!;

        using var detail = await DataAsync(await client.GetAsync($"/v1/education/public/courses/{courseId}"));
        var objective = detail.RootElement.GetProperty("objectives").EnumerateArray().Single();
        Assert.NotEmpty(objective.GetProperty("studyItems").EnumerateArray());
        Assert.All(objective.GetProperty("studyItems").EnumerateArray(), item =>
        {
            Assert.False(item.TryGetProperty("hint", out _));
            Assert.False(item.TryGetProperty("mediaRef", out _));
        });
        var assessmentId = detail.RootElement.GetProperty("assessments").EnumerateArray().Single().GetProperty("id").GetString()!;

        using var started = await DataAsync(await client.PostAsync(
            $"/v1/education/guided/courses/{courseId}/assessments/{assessmentId}/sessions", content: null));
        var sessionId = started.RootElement.GetProperty("sessionId").GetString()!;
        var version = started.RootElement.GetProperty("version").GetInt32();
        var questions = started.RootElement.GetProperty("questions").EnumerateArray()
            .Select(item => item.GetProperty("question").Clone()).ToArray();
        Assert.Equal(6, questions.Length);

        for (var index = 0; index < questions.Length; index++)
        {
            var questionId = questions[index].GetProperty("id").GetString()!;
            using var check = await DataAsync(await client.PostAsJsonAsync(
                $"/v1/education/guided/sessions/{sessionId}/questions/{questionId}/check",
                new { requestId = $"starter-{index}", expectedVersion = version, answer = EnglishAnswer(index) }));
            Assert.True(check.RootElement.GetProperty("isCorrect").GetBoolean());
            version = check.RootElement.GetProperty("sessionVersion").GetInt32();
        }

        using var resumed = await DataAsync(await client.PostAsync(
            $"/v1/education/guided/courses/{courseId}/assessments/{assessmentId}/sessions", content: null));
        Assert.Equal(sessionId, resumed.RootElement.GetProperty("sessionId").GetString());
        Assert.True(resumed.RootElement.GetProperty("isComplete").GetBoolean());
        Assert.All(resumed.RootElement.GetProperty("questions").EnumerateArray(), item =>
        {
            Assert.True(item.GetProperty("progress").GetProperty("solved").GetBoolean());
            Assert.Equal(1, item.GetProperty("progress").GetProperty("attemptCount").GetInt32());
        });
        using (var homeProgress = await DataAsync(await client.GetAsync("/v1/education/guided/courses/home-progress")))
            Assert.Equal(courseId, homeProgress.RootElement.GetProperty("courseId").GetString());

        using var catalogForNext = await DataAsync(await client.GetAsync("/v1/education/public/courses"));
        var mathCourseId = catalogForNext.RootElement.EnumerateArray()
            .Single(item => item.GetProperty("title").GetString() == "Math: Fractions of one whole")
            .GetProperty("id").GetString()!;
        using var mathDetail = await DataAsync(await client.GetAsync($"/v1/education/public/courses/{mathCourseId}"));
        var mathAssessmentId = mathDetail.RootElement.GetProperty("assessments").EnumerateArray().Single()
            .GetProperty("id").GetString()!;
        await DataAsync(await client.PostAsync(
            $"/v1/education/guided/courses/{mathCourseId}/assessments/{mathAssessmentId}/sessions", content: null));
        using (var homeProgress = await DataAsync(await client.GetAsync("/v1/education/guided/courses/home-progress")))
            Assert.Equal(mathCourseId, homeProgress.RootElement.GetProperty("courseId").GetString());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var course = await db.EducationCourses.SingleAsync(item => item.Id == mathCourseId);
            course.SetModerationHidden(true, "starter progress fallback test", DateTime.UtcNow);
            await db.SaveChangesAsync();
        }
        using (var homeProgress = await DataAsync(await client.GetAsync("/v1/education/guided/courses/home-progress")))
            Assert.Equal(courseId, homeProgress.RootElement.GetProperty("courseId").GetString());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Empty(await db.EducationMemberships.Where(item => item.UserId == userId).ToListAsync());
            Assert.Empty(await db.MemorySets.Where(item => item.UserId == userId).ToListAsync());
            Assert.Empty(await db.EducationAssignmentRecipients.Where(item => item.StudentUserId == userId).ToListAsync());
        }
    }

    [Fact]
    public async Task RestrictedLearnerDoesNotReceiveThePublicCatalog()
    {
        using var client = factory.CreateClient();
        var userId = await RegisterAsync(client);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(item => item.Id == userId);
            user.AccountMode = AccountMode.RestrictedLearner;
            await db.SaveChangesAsync();
        }

        var response = await client.GetAsync("/v1/education/public/courses");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminCanManageDatabaseBackedStarterContentAndReseedingDoesNotOverwriteIt()
    {
        using var learner = factory.CreateClient();
        await RegisterAsync(learner);
        using var admin = factory.CreateClient();
        await RegisterAdminAsync(admin);

        using var listed = await DataAsync(await admin.GetAsync("/v1/education/courses"));
        var starter = listed.RootElement.EnumerateArray().Single(course =>
            course.GetProperty("id").GetString() == "system-starter-english-requests-v1");
        Assert.True(starter.GetProperty("isPlatformCourse").GetBoolean());
        var courseId = starter.GetProperty("id").GetString()!;

        using var detail = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        var objective = detail.RootElement.GetProperty("objectives").EnumerateArray().Single();
        var objectiveId = objective.GetProperty("id").GetString()!;
        using var authorItems = await DataAsync(await admin.GetAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"));
        var item = authorItems.RootElement.EnumerateArray().First();
        var itemId = item.GetProperty("id").GetString()!;
        await DataAsync(await admin.PostAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/retract",
            JsonContent.Create(new { })));
        var changedText = "Can I have some water, please? is a polite request for a drink.";
        await DataAsync(await admin.PutAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}",
            new { stableKey = item.GetProperty("stableKey").GetString(), position = item.GetProperty("position").GetInt32(),
                kind = item.GetProperty("kind").GetString(), primary = changedText, secondary = item.GetProperty("secondary").GetString(),
                phonetic = item.GetProperty("phonetic").GetString(), extra = item.GetProperty("extra").GetString(),
                hint = item.GetProperty("hint").GetString(), mediaRef = item.GetProperty("mediaRef").GetString(),
                languageCode = item.GetProperty("languageCode").GetString() }));
        await DataAsync(await admin.PostAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish",
            new { notConfidentialExamContent = true }));
        await DataAsync(await admin.PutAsJsonAsync($"/v1/education/courses/{courseId}/title",
            new { title = "English: Polite requests and replies" }));

        using (var scope = factory.Services.CreateAsyncScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<EducationStarterCatalogSeeder>();
            await seeder.SeedAsync();
        }

        using var refreshed = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.Equal("English: Polite requests and replies", refreshed.RootElement.GetProperty("title").GetString());
        Assert.Contains(refreshed.RootElement.GetProperty("objectives").EnumerateArray().Single()
            .GetProperty("studyItems").EnumerateArray(), row => row.GetProperty("primary").GetString() == changedText);
        using var ownCourses = await DataAsync(await learner.GetAsync("/v1/education/courses?isAdmin=true"));
        Assert.DoesNotContain(ownCourses.RootElement.EnumerateArray(), row => row.GetProperty("id").GetString() == courseId);
        Assert.Equal(HttpStatusCode.NotFound, (await learner.PutAsJsonAsync($"/v1/education/courses/{courseId}/title",
            new { title = "Spoofed title", isAdmin = true })).StatusCode);
    }

    [Fact]
    public async Task AdminCanCreateAnImmutableRevisionDraftWithFreshQuestionIds()
    {
        using var learner = factory.CreateClient();
        await RegisterAsync(learner);
        using var admin = factory.CreateClient();
        await RegisterAdminAsync(admin);

        const string sourceAssessmentId = "system-starter-english-requests-v1-lesson-v1";
        using var source = await DataAsync(await admin.GetAsync($"/v1/education/assessments/{sourceAssessmentId}"));
        var sourceVersion = source.RootElement.GetProperty("version").GetInt32();
        var sourceQuestionIds = source.RootElement.GetProperty("questions").EnumerateArray()
            .Select(question => question.GetProperty("id").GetString()).ToArray();
        using var created = await DataAsync(await admin.PostAsJsonAsync(
            $"/v1/education/assessments/{sourceAssessmentId}/revision-draft",
            new { expectedVersion = sourceVersion }));
        var revisionId = created.RootElement.GetProperty("id").GetString()!;
        Assert.NotEqual(sourceAssessmentId, revisionId);
        Assert.Equal("draft", created.RootElement.GetProperty("status").GetString());
        Assert.False(created.RootElement.GetProperty("isPublicPractice").GetBoolean());
        var revisedQuestions = created.RootElement.GetProperty("questions").EnumerateArray().ToArray();
        Assert.Equal(sourceQuestionIds.Length, revisedQuestions.Length);
        Assert.All(revisedQuestions, question => Assert.DoesNotContain(question.GetProperty("id").GetString(), sourceQuestionIds));
        Assert.Equal(source.RootElement.GetProperty("questions").EnumerateArray()
                .Select(question => question.GetProperty("objectiveId").GetString()).ToArray(),
            revisedQuestions.Select(question => question.GetProperty("objectiveId").GetString()).ToArray());

        using var unchanged = await DataAsync(await admin.GetAsync($"/v1/education/assessments/{sourceAssessmentId}"));
        Assert.Equal(sourceVersion, unchanged.RootElement.GetProperty("version").GetInt32());
        Assert.Equal(sourceQuestionIds, unchanged.RootElement.GetProperty("questions").EnumerateArray()
            .Select(question => question.GetProperty("id").GetString()).ToArray());
        var courseId = created.RootElement.GetProperty("courseId").GetString()!;
        using var learnerView = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
        Assert.DoesNotContain(learnerView.RootElement.GetProperty("assessments").EnumerateArray(),
            assessment => assessment.GetProperty("id").GetString() == revisionId);

        using var blankDraft = await DataAsync(await admin.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments",
            new { title = "Unpublished draft" }));
        var draftId = blankDraft.RootElement.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsJsonAsync(
            $"/v1/education/assessments/{draftId}/revision-draft", new { expectedVersion = 1 })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync(
            $"/v1/education/assessments/{draftId}/public-practice",
            new { isPublicPractice = true, notConfidentialExamContent = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await learner.PostAsJsonAsync(
            $"/v1/education/assessments/{sourceAssessmentId}/revision-draft",
            new { expectedVersion = sourceVersion, isAdmin = true })).StatusCode);
    }

    [Fact]
    public async Task HidingSelfPracticeRevokesGuidedReadsAndReenableResumesStoredProgress()
    {
        using var learner = factory.CreateClient();
        await RegisterAsync(learner);
        using var admin = factory.CreateClient();
        await RegisterAdminAsync(admin);
        const string courseId = "system-starter-english-requests-v1";
        const string assessmentId = "system-starter-english-requests-v1-lesson-v1";
        using var source = await DataAsync(await admin.GetAsync($"/v1/education/assessments/{assessmentId}"));
        var assessmentVersion = source.RootElement.GetProperty("version").GetInt32();
        Assert.True(source.RootElement.GetProperty("isPublicPractice").GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound, (await learner.PutAsJsonAsync(
            $"/v1/education/assessments/{assessmentId}/public-practice",
            new { isPublicPractice = false, isAdmin = true })).StatusCode);

        using var started = await DataAsync(await learner.PostAsync(
            $"/v1/education/guided/courses/{courseId}/assessments/{assessmentId}/sessions", content: null));
        var sessionId = started.RootElement.GetProperty("sessionId").GetString()!;
        var firstQuestion = started.RootElement.GetProperty("questions").EnumerateArray().First().GetProperty("question");
        Assert.Equal("single-choice", firstQuestion.GetProperty("type").GetString());
        var questionId = firstQuestion.GetProperty("id").GetString()!;
        var optionId = firstQuestion.GetProperty("options").EnumerateArray().First().GetProperty("id").GetString()!;
        using var checkedAnswer = await DataAsync(await learner.PostAsJsonAsync(
            $"/v1/education/guided/sessions/{sessionId}/questions/{questionId}/check",
            new { requestId = "visibility-toggle-check", expectedVersion = started.RootElement.GetProperty("version").GetInt32(),
                answer = new { type = "single-choice", optionId } }));
        var checkedVersion = checkedAnswer.RootElement.GetProperty("sessionVersion").GetInt32();
        var formalAttemptCount = 0;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            formalAttemptCount = await db.EducationAssessmentAttempts.CountAsync(item => item.AssessmentId == assessmentId);
        }

        try
        {
            await DataAsync(await admin.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}/public-practice",
                new { isPublicPractice = false }));
            Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/courses/{courseId}")).StatusCode);
            using (var publicCatalog = await DataAsync(await learner.GetAsync("/v1/education/public/courses")))
                Assert.DoesNotContain(publicCatalog.RootElement.EnumerateArray(), course => course.GetProperty("id").GetString() == courseId);
            Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/guided/sessions/{sessionId}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await learner.PostAsJsonAsync(
                $"/v1/education/guided/sessions/{sessionId}/questions/{questionId}/check",
                new { requestId = "visibility-toggle-check", expectedVersion = started.RootElement.GetProperty("version").GetInt32(),
                    answer = new { type = "single-choice", optionId } })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await learner.PostAsync(
                $"/v1/education/guided/courses/{courseId}/assessments/{assessmentId}/sessions", content: null)).StatusCode);

            Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync(
                $"/v1/education/assessments/{assessmentId}/public-practice",
                new { isPublicPractice = true })).StatusCode);
            await DataAsync(await admin.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}/public-practice",
                new { isPublicPractice = true, notConfidentialExamContent = true }));
            using var resumed = await DataAsync(await learner.GetAsync($"/v1/education/guided/sessions/{sessionId}"));
            Assert.Equal(checkedVersion, resumed.RootElement.GetProperty("version").GetInt32());
            Assert.Equal(1, resumed.RootElement.GetProperty("questions").EnumerateArray().Single(question =>
                question.GetProperty("question").GetProperty("id").GetString() == questionId)
                .GetProperty("progress").GetProperty("attemptCount").GetInt32());
            using var visibleAgain = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}"));
            Assert.Contains(visibleAgain.RootElement.GetProperty("assessments").EnumerateArray(),
                assessment => assessment.GetProperty("id").GetString() == assessmentId);
        }
        finally
        {
            using var current = await DataAsync(await admin.GetAsync($"/v1/education/assessments/{assessmentId}"));
            if (!current.RootElement.GetProperty("isPublicPractice").GetBoolean())
                await admin.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}/public-practice",
                    new { isPublicPractice = true, notConfidentialExamContent = true });
        }

        using (var unchanged = await DataAsync(await admin.GetAsync($"/v1/education/assessments/{assessmentId}")))
        {
            Assert.Equal(assessmentVersion, unchanged.RootElement.GetProperty("version").GetInt32());
            Assert.Equal("published", unchanged.RootElement.GetProperty("status").GetString());
        }
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(formalAttemptCount, await db.EducationAssessmentAttempts.CountAsync(item => item.AssessmentId == assessmentId));
            var objectiveId = source.RootElement.GetProperty("questions").EnumerateArray().First()
                .GetProperty("objectiveId").GetString()!;
            var privateAssessment = new MemoPal.Domain.Entities.EducationAssessment
            {
                Id = Guid.NewGuid().ToString("D"), CourseId = courseId, UserId = "system", Title = "Manual response only"
            };
            privateAssessment.Questions.Add(new MemoPal.Domain.Entities.EducationQuestion
            {
                Id = Guid.NewGuid().ToString("D"), AssessmentId = privateAssessment.Id, ObjectiveId = objectiveId,
                Prompt = "Draw a plant.", Type = "photo-response", MaxScore = 1, Position = 0,
                OptionsJson = "[]", AnswerKeyJson = "{\"gradingRubric\":\"Show a plant drawing.\"}"
            });
            privateAssessment.Publish(DateTime.UtcNow);
            db.EducationAssessments.Add(privateAssessment);
            await db.SaveChangesAsync();
            var enableManualOnly = await admin.PutAsJsonAsync($"/v1/education/assessments/{privateAssessment.Id}/public-practice",
                new { isPublicPractice = true, notConfidentialExamContent = true });
            Assert.Equal(HttpStatusCode.BadRequest, enableManualOnly.StatusCode);
        }
    }

    private static object EnglishAnswer(int index) => index switch
    {
        0 => new { type = "single-choice", optionId = "A" },
        1 => new { type = "multiple-select", optionIds = new[] { "A", "B" } },
        2 => new { type = "ordering", orderedOptionIds = new[] { "p3", "p6", "p5", "p2", "p4", "p1" } },
        3 => new { type = "matching", matches = new[] {
            new { leftOptionId = "L1", matchTargetId = "R2" }, new { leftOptionId = "L2", matchTargetId = "R1" } } },
        4 => new { type = "true-false", booleanValue = true },
        5 => new { type = "text", textValue = "borrow" },
        _ => throw new ArgumentOutOfRangeException(nameof(index))
    };

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        using var envelope = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Starter learner", email = $"starter-{Guid.NewGuid():N}@example.test",
            password = Guid.NewGuid().ToString("N") + "aA9!"
        }));
        var token = envelope.RootElement.GetProperty("token").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return envelope.RootElement.GetProperty("user").GetProperty("id").GetString()!;
    }

    private async Task RegisterAdminAsync(HttpClient client)
    {
        const string password = "password123";
        var email = $"starter-admin-{Guid.NewGuid():N}@example.test";
        using var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Starter catalog admin", email, password
        }));
        var userId = account.RootElement.GetProperty("user").GetProperty("id").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Users.SingleAsync(user => user.Id == userId)).Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        using var login = await DataAsync(await client.PostAsJsonAsync("/auth/login", new { email, password }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            login.RootElement.GetProperty("token").GetString());
    }

    private static async Task<JsonDocument> DataAsync(HttpResponseMessage response)
    {
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(response.IsSuccessStatusCode, envelope.GetProperty("message").GetString());
        Assert.True(envelope.GetProperty("success").GetBoolean());
        return JsonDocument.Parse(envelope.GetProperty("data").GetRawText());
    }
}
