using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Domain.Education;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace MemoPal.IntegrationTests;

public sealed class RestrictedLearnerEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Authentication_ignores_client_account_mode_and_returns_the_persisted_mode()
    {
        using var admin = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var email = $"mode-input-{Guid.NewGuid():N}@example.test";
        var password = Guid.NewGuid().ToString("N") + "aA9!";
        var registration = await DataAsync(await learner.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Mode test", email, password, accountMode = "RestrictedLearner"
        }));
        var id = registration.GetProperty("user").GetProperty("id").GetString()!;
        Assert.Equal("Standard", registration.GetProperty("user").GetProperty("accountMode").GetString());
        await SetRestrictedAsync(admin, id);
        var login = await DataAsync(await learner.PostAsJsonAsync("/auth/login", new { email, password, accountMode = "Standard" }));
        Assert.Equal("RestrictedLearner", login.GetProperty("user").GetProperty("accountMode").GetString());
    }

    [Fact]
    public async Task Restricted_activity_is_excluded_from_community_popularity_and_detail_counts()
    {
        using var admin = factory.CreateClient();
        using var owner = factory.CreateClient();
        using var child = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        await RegisterAsync(owner);
        var childId = await RegisterAsync(child);
        var memory = await CreateMemoryAsync(owner);
        var id = memory.GetProperty("id").GetString();
        await DataAsync(await owner.PatchAsJsonAsync($"/v1/memory-sets/{id}/visibility", new { visibility = "public" }));
        await DataAsync(await child.PostAsync($"/v1/community/memory-sets/{id}/copy", null));
        await DataAsync(await child.PutAsJsonAsync($"/v1/community/memory-sets/{id}/reaction", new { isHelpful = true }));
        var withChild = await DataAsync(await owner.GetAsync($"/v1/community/memory-sets/{id}"));
        Assert.Equal(1, withChild.GetProperty("copyCount").GetInt32());
        Assert.Equal(1, withChild.GetProperty("helpfulCount").GetInt32());
        await SetRestrictedAsync(admin, childId);
        var after = await DataAsync(await owner.GetAsync($"/v1/community/memory-sets/{id}"));
        Assert.Equal(0, after.GetProperty("copyCount").GetInt32());
        Assert.Equal(0, after.GetProperty("helpfulCount").GetInt32());
        var catalog = await DataAsync(await owner.GetAsync("/v1/community/memory-sets?sort=popular&pageSize=50"));
        var entry = Assert.Single(catalog.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        Assert.Equal(0, entry.GetProperty("copyCount").GetInt32());
        Assert.Equal(0, entry.GetProperty("helpfulCount").GetInt32());
    }

    [Fact]
    public async Task Unclassified_action_fails_closed_and_admin_mode_response_and_logs_do_not_expose_private_payload()
    {
        using var logs = new RestrictedPolicyLogCapture();
        await using var app = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureLogging(logging => logging.AddProvider(logs));
            builder.ConfigureServices(services => services.AddControllers().AddApplicationPart(typeof(RestrictedPolicyProbeController).Assembly));
        });
        using var admin = app.CreateClient();
        using var learner = app.CreateClient();
        await RegisterAsync(admin, admin: true);
        var id = await RegisterAsync(learner);
        Assert.Equal(HttpStatusCode.OK, (await learner.GetAsync("/restricted-policy-test-probe")).StatusCode);
        const string privateReason = "SENSITIVE_AUDIT_REASON_do_not_log";
        var response = await admin.PutAsJsonAsync($"/admin/users/{id}/account-mode",
            new { accountMode = "RestrictedLearner", reason = privateReason });
        Assert.Equal(JsonValueKind.True, (await DataAsync(response)).ValueKind);
        var body = await response.Content.ReadAsStringAsync();
        foreach (var field in new[] { privateReason, "memorySet", "assignment", "grade", "email", "displayName" })
            Assert.DoesNotContain(field, body, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(HttpStatusCode.Forbidden, (await learner.GetAsync("/restricted-policy-test-probe")).StatusCode);
        Assert.DoesNotContain(logs.Messages, message => message.Contains(privateReason, StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Restricted_bridge_requires_active_classroom_even_for_public_course_and_withdrawal_revokes_source_access(bool assignmentPath)
    {
        using var admin = factory.CreateClient();
        using var teacher = factory.CreateClient();
        using var child = factory.CreateClient();
        using var standard = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var teacherId = await RegisterAsync(teacher);
        var childId = await RegisterAsync(child);
        await RegisterAsync(standard);
        var courseId = (await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Class source" }))).GetProperty("id").GetString();
        var objectiveId = (await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Steps" }))).GetProperty("id").GetString();
        var authorRoute = $"/v1/education/courses/{courseId}/objectives/{objectiveId}";
        await DataAsync(await teacher.PutAsJsonAsync(authorRoute + "/study-metadata", new
        {
            memoryContentType = "OrderedList", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed"
        }));
        var studyId = (await DataAsync(await teacher.PostAsJsonAsync(authorRoute + "/study-items", new
        {
            stableKey = "one", kind = "OrderedList", position = 1, primary = "先仔细观察"
        }))).GetProperty("id").GetString();
        await DataAsync(await teacher.PostAsJsonAsync(authorRoute + $"/study-items/{studyId}/publish", new { notConfidentialExamContent = false }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title = "Class check" }));
        var assessmentId = assessment.GetProperty("id").GetString();
        assessment = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = 1, title = "Class check", questions = new[] { new { prompt = "先观察？", type = "true-false", maxScore = 1,
                objectiveId, correctBooleanAnswer = true, options = Array.Empty<object>(), allowedTextAnswers = Array.Empty<string>(), allowedNumericAnswers = Array.Empty<decimal>() } }
        }));
        await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(), isPublicPractice = true
        }));
        await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true, notConfidentialExamContent = true }));
        var bridge = $"/v1/education/public/objectives/{objectiveId}/memory-bridge";
        Assert.Equal(HttpStatusCode.OK, (await standard.GetAsync(bridge)).StatusCode);
        await SetRestrictedAsync(admin, childId);
        var deniedSource = await child.GetAsync(bridge);
        Assert.Equal(HttpStatusCode.Forbidden, deniedSource.StatusCode);
        var missingSource = await child.GetAsync($"/v1/education/public/objectives/{Guid.NewGuid():N}/memory-bridge");
        Assert.Equal(deniedSource.StatusCode, missingSource.StatusCode);
        Assert.Equal(await deniedSource.Content.ReadAsStringAsync(), await missingSource.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.Forbidden, (await child.PostAsJsonAsync(bridge + "/derive", new { techniqueKey = "number-peg" })).StatusCode);
        var classroomId = (await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Class" }))).GetProperty("id").GetString();
        var membershipId = (await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId = childId, role = "student" }))).GetProperty("id").GetString();
        await DataAsync(await child.PostAsync($"/v1/education/memberships/{membershipId}/accept", null));
        string? assignmentId = null;
        if (assignmentPath)
        {
            assignmentId = (await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
            {
                assessmentId, title = "Own work", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddDays(1),
                idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { childId }, enableStudentLeaderboard = false
            }))).GetProperty("id").GetString();
        }
        else await DataAsync(await teacher.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));
        var before = await SideEffectsAsync();
        var objectives = await DataAsync(await child.GetAsync($"/v1/education/public/courses/{courseId}/objectives"));
        Assert.Equal(assignmentPath ? 1 : 0, objectives[0].GetProperty("assessments").GetArrayLength());
        Assert.Single((await DataAsync(await child.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());
        await DataAsync(await child.GetAsync(bridge));
        var memoryId = (await DataAsync(await child.PostAsJsonAsync(bridge + "/derive", new { techniqueKey = "number-peg" }))).GetProperty("memorySetId").GetString();
        await DataAsync(await child.PostAsync(bridge + "/number-peg/sync", null));
        var personal = await DataAsync(await child.GetAsync($"/v1/memory-sets/{memoryId}"));
        Assert.Equal("private", personal.GetProperty("visibility").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await standard.GetAsync($"/v1/memory-sets/{memoryId}")).StatusCode);
        Assert.Equal(before, await SideEffectsAsync());
        if (assignmentId is not null)
        {
            await DataAsync(await child.GetAsync("/v1/education/my/assignments"));
            var attempt = await DataAsync(await child.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
            var attemptId = attempt.GetProperty("id").GetString();
            Assert.DoesNotContain("correctBooleanAnswer", attempt.GetRawText());
            await DataAsync(await child.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
            {
                questionId = attempt.GetProperty("questions")[0].GetProperty("id").GetString(), expectedVersion = attempt.GetProperty("version").GetInt32(),
                clear = false, answer = new { type = "true-false", booleanValue = true }
            }));
            await DataAsync(await child.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));
            // Advance the fixture's due boundary; keep the production publication rule intact.
            await using (var timeScope = factory.Services.CreateAsyncScope())
            {
                var timeDb = timeScope.ServiceProvider.GetRequiredService<AppDbContext>();
                (await timeDb.EducationAssignments.SingleAsync(x => x.Id == assignmentId)).DueAt = DateTime.UtcNow.AddMinutes(-1);
                await timeDb.SaveChangesAsync();
            }
            await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));
            Assert.True((await DataAsync(await child.GetAsync($"/v1/education/attempts/{attemptId}"))).GetProperty("resultPublished").GetBoolean());
            var classroomBoard = await DataAsync(await child.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
            Assert.Empty(classroomBoard.GetProperty("visibleEntries").EnumerateArray());
            Assert.Equal(before.Practice, (await SideEffectsAsync()).Practice);
            Assert.Equal(before.Xp, (await SideEffectsAsync()).Xp);
            var attachmentRoute = $"/v1/education/attempts/{attemptId}/responses/{attempt.GetProperty("questions")[0].GetProperty("id").GetString()}/attachments/missing";
            Assert.Equal(HttpStatusCode.NotFound, (await teacher.GetAsync(attachmentRoute)).StatusCode);
            await SetRestrictedAsync(admin, teacherId);
            Assert.Equal(HttpStatusCode.Forbidden, (await teacher.GetAsync(attachmentRoute)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await child.GetAsync(attachmentRoute)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await teacher.GetAsync($"/v1/education/assignments/{assignmentId}")).StatusCode);
            await DataAsync(await admin.PutAsJsonAsync($"/admin/users/{teacherId}/account-mode", new { accountMode = "Standard", reason = "restore fixture teacher" }));
        }
        await DataAsync(await teacher.DeleteAsync($"/v1/education/memberships/{membershipId}"));
        Assert.Equal(HttpStatusCode.Forbidden, (await child.GetAsync(bridge)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await child.PostAsync(bridge + "/number-peg/sync", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await child.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await child.GetAsync($"/v1/memory-sets/{memoryId}")).StatusCode);
    }

    [Theory]
    [InlineData("GET", "/v1/community/memory-sets", 200)]
    [InlineData("GET", "/v1/community/memory-sets?search=example", 200)]
    [InlineData("GET", "/v1/community/memory-sets/missing", 404)]
    [InlineData("POST", "/v1/community/memory-sets/missing/copy", 404)]
    [InlineData("PUT", "/v1/community/memory-sets/missing/bookmark", 404)]
    [InlineData("PUT", "/v1/community/memory-sets/missing/reaction", 404)]
    [InlineData("GET", "/v1/leaderboards/catalog", 200)]
    [InlineData("GET", "/v1/leaderboards/current", 200)]
    [InlineData("PUT", "/v1/leaderboards/preference", 200)]
    [InlineData("GET", "/v1/education/public/courses", 200)]
    [InlineData("GET", "/v1/education/public/courses/missing", 404)]
    [InlineData("GET", "/v1/education/public/saved-courses", 200)]
    [InlineData("GET", "/v1/education/public/practice-history", 200)]
    [InlineData("GET", "/v1/education/family/assignments", 200)]
    [InlineData("GET", "/v1/education/assignments/missing", 404)]
    public async Task Denied_categories_return_the_same_safe_403_and_standard_behavior_is_preserved(string method, string route, int standardStatus)
    {
        using var admin = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var id = await RegisterAsync(learner);
        using var standardRequest = new HttpRequestMessage(new HttpMethod(method), route);
        if (method != "GET") standardRequest.Content = JsonContent.Create(new { optedIn = false, isHelpful = false, isBookmarked = false });
        Assert.Equal(standardStatus, (int)(await learner.SendAsync(standardRequest)).StatusCode);
        await SetRestrictedAsync(admin, id);
        using var restrictedRequest = new HttpRequestMessage(new HttpMethod(method), route);
        if (method != "GET") restrictedRequest.Content = JsonContent.Create(new { optedIn = false, isHelpful = false, isBookmarked = false });
        var response = await learner.SendAsync(restrictedRequest);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(body.GetProperty("success").GetBoolean());
        Assert.Equal("Access denied.", body.GetProperty("message").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("data").ValueKind);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("errors").ValueKind);
    }

    [Theory]
    [InlineData("/v1/palace-associations/generate")]
    [InlineData("/v1/number-peg-stories/generate")]
    [InlineData("/v1/ai-credits/number-peg-images")]
    [InlineData("/media/images")]
    [InlineData("/auth/avatar-upload")]
    [InlineData("/referrals/redeem")]
    public async Task Public_upload_external_generation_and_social_writes_are_blocked_before_body_processing(string route)
    {
        using var admin = factory.CreateClient();
        using var child = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var id = await RegisterAsync(child);
        await SetRestrictedAsync(admin, id);
        using HttpContent content = route is "/media/images" or "/auth/avatar-upload"
            ? new MultipartFormDataContent() : JsonContent.Create(new { });
        Assert.Equal(HttpStatusCode.Forbidden, (await child.PostAsync(route, content)).StatusCode);
    }

    [Fact]
    public async Task Restricted_learner_can_use_own_memory_practice_and_presets_but_cannot_publish_or_read_another_owner()
    {
        using var admin = factory.CreateClient();
        using var child = factory.CreateClient();
        using var other = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var childId = await RegisterAsync(child);
        await RegisterAsync(other);
        var foreign = await CreateMemoryAsync(other);
        await SetRestrictedAsync(admin, childId);
        var memory = await CreateMemoryAsync(child);
        var id = memory.GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.OK, (await child.GetAsync($"/v1/memory-sets/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await child.GetAsync($"/v1/memory-sets/{foreign.GetProperty("id").GetString()}")).StatusCode);
        foreach (var visibility in new[] { "public", "unlisted" })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await child.PatchAsJsonAsync($"/v1/memory-sets/{id}/visibility", new { visibility })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await child.PostAsJsonAsync("/v1/memory-sets",
                new { title = "Must fail", visibility, status = "draft" })).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await child.PutAsJsonAsync($"/v1/memory-sets/{id}",
                new { title = "Must fail", visibility, status = "draft", expectedVersion = memory.GetProperty("version").GetInt32() })).StatusCode);
        }
        var edited = await DataAsync(await child.PutAsJsonAsync($"/v1/memory-sets/{id}", new
        {
            title = "My revised private draft", status = "draft", visibility = "private", techniqueKey = "number-peg",
            expectedVersion = memory.GetProperty("version").GetInt32(),
            items = new[] { new { position = 1, prompt = "First", answer = "个人内容" } }
        }));
        Assert.Equal("private", edited.GetProperty("visibility").GetString());
        Assert.Equal("private", (await DataAsync(await child.PostAsync($"/v1/memory-sets/{id}/duplicate", null))).GetProperty("visibility").GetString());
        var ready = await CreateMemoryAsync(child);
        await SubmitPracticeAsync(child, ready);
        foreach (var route in new[] { "/v1/memory-sets", "/v1/practice-attempts/stats", "/v1/palace-scenes", "/system-settings/number-peg-definitions", "/users/stats" })
            Assert.Equal(HttpStatusCode.OK, (await child.GetAsync(route)).StatusCode);
    }

    [Fact]
    public async Task Existing_public_memory_is_hidden_without_mutation_and_admin_privatization_is_explicit_and_audited()
    {
        using var admin = factory.CreateClient();
        using var owner = factory.CreateClient();
        using var reader = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        var ownerId = await RegisterAsync(owner);
        await RegisterAsync(reader);
        var memory = await CreateMemoryAsync(owner);
        var id = memory.GetProperty("id").GetString();
        await DataAsync(await owner.PatchAsJsonAsync($"/v1/memory-sets/{id}/visibility", new { visibility = "public" }));
        Assert.Equal(HttpStatusCode.OK, (await reader.GetAsync($"/v1/community/memory-sets/{id}")).StatusCode);
        await SetRestrictedAsync(admin, ownerId);
        Assert.Equal(HttpStatusCode.NotFound, (await reader.GetAsync($"/v1/community/memory-sets/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await reader.PostAsync($"/v1/community/memory-sets/{id}/copy", null)).StatusCode);
        var catalog = await DataAsync(await reader.GetAsync("/v1/community/memory-sets?sort=popular&pageSize=50"));
        Assert.DoesNotContain(catalog.EnumerateArray(), x => x.GetProperty("id").GetString() == id);
        Assert.Equal("public", (await DataAsync(await owner.GetAsync($"/v1/memory-sets/{id}"))).GetProperty("visibility").GetString());
        var route = $"/admin/users/{ownerId}/memory-sets/{id}/make-private";
        Assert.Equal(HttpStatusCode.Forbidden, (await reader.PostAsJsonAsync(route, new { reason = "not authorized" })).StatusCode);
        Assert.Equal(JsonValueKind.True, (await DataAsync(await admin.PostAsJsonAsync(route, new { reason = "explicit privacy request" }))).ValueKind);
        Assert.Equal("private", (await DataAsync(await owner.GetAsync($"/v1/memory-sets/{id}"))).GetProperty("visibility").GetString());
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Single(await db.AccountModeAudits.Where(x => x.SubjectUserId == ownerId && x.Action == "MakeMemoryPrivate").ToListAsync());
    }

    [Fact]
    public async Task Existing_weekly_participation_is_excluded_and_standard_snapshot_stays_identical()
    {
        using var admin = factory.CreateClient();
        using var standard = factory.CreateClient();
        using var child = factory.CreateClient();
        await RegisterAsync(admin, admin: true);
        await RegisterAsync(standard);
        var childId = await RegisterAsync(child);
        await DataAsync(await standard.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = true }));
        var before = await DataAsync(await standard.GetAsync("/v1/leaderboards/current"));
        await DataAsync(await child.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = true }));
        await DataAsync(await child.GetAsync("/v1/leaderboards/current"));
        // Five distinct items meet the default daily scoring threshold, so this
        // participant would move the Standard learner's rank if not excluded.
        for (var item = 0; item < 5; item++)
        {
            var memory = await CreateMemoryAsync(child);
            await SubmitPracticeAsync(child, memory);
        }
        var withChild = await DataAsync(await standard.GetAsync("/v1/leaderboards/current"));
        Assert.Equal(before.GetProperty("eligibleParticipants").GetInt32() + 1, withChild.GetProperty("eligibleParticipants").GetInt32());
        Assert.True(withChild.GetProperty("myRank").GetInt32() > before.GetProperty("myRank").GetInt32());
        await SetRestrictedAsync(admin, childId);
        var after = await DataAsync(await standard.GetAsync("/v1/leaderboards/current"));
        foreach (var field in new[] { "entries", "eligibleParticipants", "myRank", "myScore", "myProjectedRewardCredits" })
            Assert.Equal(before.GetProperty(field).GetRawText(), after.GetProperty(field).GetRawText());
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await db.LeaderboardSeasonParticipants.AnyAsync(x => x.UserId == childId && !x.IsDeleted));
    }

    [Fact]
    public async Task Admin_mode_toggle_is_immediate_for_the_same_token_and_non_admin_is_denied()
    {
        using var admin = factory.CreateClient();
        using var learner = factory.CreateClient();
        var adminId = await RegisterAsync(admin, admin: true);
        var learnerId = await RegisterAsync(learner);
        Assert.Equal(HttpStatusCode.OK, (await learner.GetAsync("/v1/community/memory-sets")).StatusCode);
        var route = $"/admin/users/{learnerId}/account-mode";
        Assert.Equal(HttpStatusCode.Forbidden, (await learner.PutAsJsonAsync(route,
            new { accountMode = "RestrictedLearner", reason = "classroom enrollment" })).StatusCode);
        var result = await DataAsync(await admin.PutAsJsonAsync(route,
            new { accountMode = "RestrictedLearner", reason = "classroom enrollment" }));
        Assert.Equal(JsonValueKind.True, result.ValueKind);
        Assert.Equal(HttpStatusCode.Forbidden, (await learner.GetAsync("/v1/community/memory-sets")).StatusCode);
        Assert.Equal("RestrictedLearner", (await DataAsync(await learner.GetAsync("/auth/me"))).GetProperty("accountMode").GetString());
        await DataAsync(await admin.PutAsJsonAsync(route, new { accountMode = "Standard", reason = "authorized release" }));
        Assert.Equal(HttpStatusCode.OK, (await learner.GetAsync("/v1/community/memory-sets")).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audits = await db.AccountModeAudits.Where(x => x.SubjectUserId == learnerId).OrderBy(x => x.CreatedAt).ToListAsync();
        Assert.Equal(2, audits.Count);
        Assert.All(audits, x => { Assert.Equal(adminId, x.OperatorUserId); Assert.NotEqual(default, x.CreatedAt); Assert.Null(x.ResourceId); });
        Assert.Equal("classroom enrollment", audits[0].Reason);
        Assert.Equal(AccountMode.Standard, audits[0].PreviousMode);
        Assert.Equal(AccountMode.RestrictedLearner, audits[0].NewMode);
        Assert.Equal(AccountMode.Standard, audits[1].NewMode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync(route, new { accountMode = "0", reason = "invalid enum" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync(route, new { accountMode = "Standard", reason = "" })).StatusCode);
    }

    private static async Task SetRestrictedAsync(HttpClient admin, string userId) =>
        _ = await DataAsync(await admin.PutAsJsonAsync($"/admin/users/{userId}/account-mode",
            new { accountMode = "RestrictedLearner", reason = "classroom enrollment" }));

    private static async Task<JsonElement> CreateMemoryAsync(HttpClient client) =>
        await DataAsync(await client.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Private learner example", goalType = "ordered-list", techniqueKey = "number-peg", status = "ready", visibility = "private",
            items = new[] { new { position = 1, prompt = "First", answer = "原创词语" } },
            techniquePlan = new { schemaVersion = 1, palaceBindings = Array.Empty<object>(),
                pegBindings = new[] { new { itemPosition = 1, pegNumber = 1, sceneText = "My own association", isCustomScene = false } } }
        }));

    private static async Task SubmitPracticeAsync(HttpClient client, JsonElement memory) =>
        _ = await DataAsync(await client.PostAsJsonAsync("/v1/practice-attempts/batch", new
        {
            attempts = new[] { new { clientAttemptId = Guid.NewGuid().ToString("N"), memorySetId = memory.GetProperty("id").GetString(),
                mode = "recall", durationMs = 3000, responses = new[] { new { memoryItemId = memory.GetProperty("items")[0].GetProperty("id").GetString(), isCorrect = true } } } }
        }));

    private async Task<string> RegisterAsync(HttpClient client, bool admin = false)
    {
        var data = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Restricted policy tester", email = $"restricted-{Guid.NewGuid():N}@example.test",
            password = Guid.NewGuid().ToString("N") + "aA9!"
        }));
        var id = data.GetProperty("user").GetProperty("id").GetString()!;
        var token = data.GetProperty("token").GetString();
        if (admin)
        {
            await using var scope = factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(x => x.Id == id);
            user.Role = UserRoles.Admin;
            await db.SaveChangesAsync();
            token = scope.ServiceProvider.GetRequiredService<IJwtTokenGenerator>()
                .GenerateAccessToken(id, user.Email, user.Role).Token;
        }
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return id;
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(data.GetProperty("success").GetBoolean());
        return data.GetProperty("data").Clone();
    }

    private async Task<(int Practice, int Xp, int Attempts)> SideEffectsAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.PracticeAttempts.CountAsync(), await db.XpEvents.CountAsync(), await db.EducationAssessmentAttempts.CountAsync());
    }
}

