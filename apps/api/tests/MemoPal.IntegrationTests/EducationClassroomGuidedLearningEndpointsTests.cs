using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.IntegrationTests.Fixtures;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationClassroomGuidedLearningEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Restricted_student_can_use_only_enabled_linked_opt_in_content_and_revocation_applies_to_session_replay()
    {
        using var author = factory.CreateClient();
        using var classroomOwner = factory.CreateClient();
        using var restrictedStudent = factory.CreateClient();
        using var otherClassStudent = factory.CreateClient();
        using var assignmentOnlyStudent = factory.CreateClient();
        using var classroomTeacher = factory.CreateClient();
        using var guardian = factory.CreateClient();
        using var admin = factory.CreateClient();
        using var outsider = factory.CreateClient();
        var authorId = await RegisterAsync(author);
        await RegisterAsync(classroomOwner);
        var studentId = await RegisterAsync(restrictedStudent);
        var otherStudentId = await RegisterAsync(otherClassStudent);
        var assignmentOnlyStudentId = await RegisterAsync(assignmentOnlyStudent);
        var teacherId = await RegisterAsync(classroomTeacher);
        var guardianId = await RegisterAsync(guardian);
        await RegisterAdminAsync(admin);
        await RegisterAsync(outsider);

        var course = await DataAsync(await author.PostAsJsonAsync("/v1/education/courses", new { title = "Private classroom science" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Cells" }));
        var objectiveId = objective.GetProperty("id").GetString()!;
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "VocabularyPair", languageCode = "en", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var studyItem = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "cell", position = 1, kind = "LanguageItem", primary = "Cell", secondary = "A basic unit of life", phonetic = "/sel/", extra = "Used in living things.", hint = "Keep this private hint hidden.", mediaRef = "media:private-audio" }));
        await DataAsync(await author.PostAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{studyItem.GetProperty("id").GetString()}/publish",
            new { notConfidentialExamContent = true }));
        var optedInAssessmentId = await CreatePublishedAssessmentAsync(author, courseId, objectiveId, "Practice cells", true);
        var examAssessmentId = await CreatePublishedAssessmentAsync(author, courseId, objectiveId, "Confidential exam", false);

        var classroomId = await CreateClassroomAsync(classroomOwner, "Guided classroom");
        var authorMembershipId = await InviteAndAcceptAsync(classroomOwner, author, classroomId, authorId, "teacher");
        var studentMembershipId = await InviteAndAcceptAsync(classroomOwner, restrictedStudent, classroomId, studentId, "student");
        await InviteAndAcceptAsync(classroomOwner, classroomTeacher, classroomId, teacherId, "teacher");
        await DataAsync(await author.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));
        var linkedCourses = await DataAsync(await restrictedStudent.GetAsync($"/v1/education/classrooms/{classroomId}/courses"));
        Assert.False(Assert.Single(linkedCourses.EnumerateArray()).GetProperty("guidedPracticeEnabled").GetBoolean());
        Assert.False(Assert.Single(linkedCourses.EnumerateArray()).GetProperty("canManageGuidedPractice").GetBoolean());

        Assert.Equal(HttpStatusCode.BadRequest, (await author.PutAsJsonAsync(
            $"/v1/education/classrooms/{classroomId}/courses/{courseId}/guided-practice",
            new { enabled = true, notConfidentialExamContent = false })).StatusCode);
        var openedLink = await DataAsync(await author.PutAsJsonAsync(
            $"/v1/education/classrooms/{classroomId}/courses/{courseId}/guided-practice",
            new { enabled = true, notConfidentialExamContent = true }));
        Assert.True(openedLink.GetProperty("guidedPracticeEnabled").GetBoolean());
        Assert.True(openedLink.GetProperty("canManageGuidedPractice").GetBoolean());
        Assert.False(openedLink.TryGetProperty("guidedPracticeConfirmedByUserId", out _));
        Assert.False(openedLink.TryGetProperty("guidedPracticeConfirmedAtUtc", out _));

        var otherClassroomId = await CreateClassroomAsync(author, "Other class");
        await InviteAndAcceptAsync(author, otherClassStudent, otherClassroomId, otherStudentId, "student");
        await InviteAndAcceptAsync(author, restrictedStudent, otherClassroomId, studentId, "student");
        var assignmentClassroomId = await CreateClassroomAsync(author, "Assignment only class");
        await InviteAndAcceptAsync(author, assignmentOnlyStudent, assignmentClassroomId, assignmentOnlyStudentId, "student");
        await DataAsync(await author.PostAsJsonAsync($"/v1/education/classrooms/{assignmentClassroomId}/assignments", new
        {
            assessmentId = optedInAssessmentId, title = "Assigned exam", opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddDays(1), idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { assignmentOnlyStudentId }, enableStudentLeaderboard = false
        }));

        var classRoot = $"/v1/education/classrooms/{classroomId}/guided";
        var progress = await DataAsync(await restrictedStudent.GetAsync($"{classRoot}/courses/{courseId}/progress"));
        var onlyLesson = Assert.Single(progress.GetProperty("lessons").EnumerateArray());
        Assert.Equal(optedInAssessmentId, onlyLesson.GetProperty("assessmentId").GetString());
        Assert.DoesNotContain(progress.GetProperty("lessons").EnumerateArray(),
            lesson => lesson.GetProperty("assessmentId").GetString() == examAssessmentId);
        var intro = await DataAsync(await restrictedStudent.GetAsync(
            $"{classRoot}/courses/{courseId}/assessments/{optedInAssessmentId}/learning-content"));
        Assert.Equal("Cells", Assert.Single(intro.GetProperty("objectives").EnumerateArray()).GetProperty("title").GetString());
        var introItem = Assert.Single(intro.GetProperty("objectives")[0].GetProperty("studyItems").EnumerateArray());
        Assert.Equal("Cell", introItem.GetProperty("primary").GetString());
        Assert.False(introItem.TryGetProperty("hint", out _));
        Assert.False(introItem.TryGetProperty("mediaRef", out _));

        var formalAttemptsBefore = await CountAsync(db => db.EducationAssessmentAttempts.CountAsync());
        var gradesBefore = await CountAsync(db => db.EducationGradeRevisions.CountAsync());
        var xpEventsBefore = await CountAsync(db => db.XpEvents.CountAsync());
        var session = await DataAsync(await restrictedStudent.PostAsync(
            $"{classRoot}/courses/{courseId}/assessments/{optedInAssessmentId}/sessions", null));
        var sessionId = session.GetProperty("sessionId").GetString()!;
        var question = session.GetProperty("questions")[0].GetProperty("question");
        var questionId = question.GetProperty("id").GetString()!;
        Assert.False(question.TryGetProperty("correctBooleanAnswer", out _));
        Assert.False(question.TryGetProperty("correctOptionId", out _));
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.PostAsync(
            $"{classRoot}/courses/{courseId}/assessments/{examAssessmentId}/sessions", null)).StatusCode);

        // Membership, course link, and teacher/guardian status are checked independently on every API route.
        Assert.Equal(HttpStatusCode.NotFound, (await classroomTeacher.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await author.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherClassStudent.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await assignmentOnlyStudent.GetAsync(
            $"/v1/education/classrooms/{assignmentClassroomId}/guided/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.GetAsync(
            $"/v1/education/classrooms/{otherClassroomId}/guided/sessions/{sessionId}")).StatusCode);

        var guardianLink = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/guardian-links", new { studentUserId = studentId }));
        var guardianLinkId = guardianLink.GetProperty("id").GetString()!;
        await DataAsync(await restrictedStudent.PostAsync($"/v1/education/guardian-links/{guardianLinkId}/confirm", null));
        await DataAsync(await admin.PostAsync($"/v1/education/guardian-links/{guardianLinkId}/verify", null));
        await SetRestrictedAsync(studentId);
        Assert.Equal(HttpStatusCode.NotFound, (await guardian.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await restrictedStudent.GetAsync($"/v1/education/guided/courses/{courseId}/progress")).StatusCode);

        var checkPath = $"{classRoot}/sessions/{sessionId}/questions/{questionId}/check";
        var payload = new { requestId = "classroom-check-once", expectedVersion = 1, answer = new { type = "true-false", booleanValue = true } };
        var wrongContextCheckPath = $"/v1/education/classrooms/{otherClassroomId}/guided/sessions/{sessionId}/questions/{questionId}/check";
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.PostAsJsonAsync(wrongContextCheckPath, payload)).StatusCode);
        var checkedAnswer = await DataAsync(await restrictedStudent.PostAsJsonAsync(checkPath, payload));
        Assert.True(checkedAnswer.GetProperty("isCorrect").GetBoolean());
        Assert.True((await DataAsync(await restrictedStudent.PostAsJsonAsync(checkPath, payload))).GetProperty("replayed").GetBoolean());
        Assert.Equal(formalAttemptsBefore, await CountAsync(db => db.EducationAssessmentAttempts.CountAsync()));
        Assert.Equal(gradesBefore, await CountAsync(db => db.EducationGradeRevisions.CountAsync()));
        Assert.Equal(xpEventsBefore, await CountAsync(db => db.XpEvents.CountAsync()));

        await DataAsync(await author.PutAsJsonAsync($"/v1/education/assessments/{optedInAssessmentId}/public-practice",
            new { isPublicPractice = false }));
        var hiddenLessons = await DataAsync(await restrictedStudent.GetAsync($"{classRoot}/courses/{courseId}/progress"));
        Assert.Empty(hiddenLessons.GetProperty("lessons").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.GetAsync(
            $"{classRoot}/courses/{courseId}/assessments/{optedInAssessmentId}/learning-content")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.PostAsync(
            $"{classRoot}/courses/{courseId}/assessments/{optedInAssessmentId}/sessions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.GetAsync($"{classRoot}/sessions/{sessionId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await restrictedStudent.PostAsJsonAsync(checkPath, payload)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await author.PutAsJsonAsync(
            $"/v1/education/assessments/{optedInAssessmentId}/public-practice",
            new { isPublicPractice = true })).StatusCode);
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/assessments/{optedInAssessmentId}/public-practice",
            new { isPublicPractice = true, notConfidentialExamContent = true }));
        var resumedAfterPracticeReenabled = await DataAsync(await restrictedStudent.GetAsync($"{classRoot}/sessions/{sessionId}"));
        Assert.Equal(1, resumedAfterPracticeReenabled.GetProperty("questions")[0].GetProperty("progress")
            .GetProperty("attemptCount").GetInt32());

        await DataAsync(await author.PutAsJsonAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}/guided-practice",
            new { enabled = false }));
        await AssertGuidedUnavailableAsync(restrictedStudent, classRoot, courseId, optedInAssessmentId, sessionId, checkPath, payload);
        await DataAsync(await author.PutAsJsonAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}/guided-practice",
            new { enabled = true, notConfidentialExamContent = true }));
        await DataAsync(await author.DeleteAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}"));
        await DataAsync(await author.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));
        linkedCourses = await DataAsync(await author.GetAsync($"/v1/education/classrooms/{classroomId}/courses"));
        Assert.False(Assert.Single(linkedCourses.EnumerateArray()).GetProperty("guidedPracticeEnabled").GetBoolean());
        await AssertGuidedUnavailableAsync(restrictedStudent, classRoot, courseId, optedInAssessmentId, sessionId, checkPath, payload);

        await DataAsync(await author.PutAsJsonAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}/guided-practice",
            new { enabled = true, notConfidentialExamContent = true }));
        await SetCourseHiddenAsync(courseId, true);
        await AssertGuidedUnavailableAsync(restrictedStudent, classRoot, courseId, optedInAssessmentId, sessionId, checkPath, payload);
        await SetCourseHiddenAsync(courseId, false);
        await DataAsync(await classroomOwner.DeleteAsync($"/v1/education/memberships/{authorMembershipId}"));
        await AssertGuidedUnavailableAsync(restrictedStudent, classRoot, courseId, optedInAssessmentId, sessionId, checkPath, payload);
        await DataAsync(await classroomOwner.DeleteAsync($"/v1/education/memberships/{studentMembershipId}"));
        await AssertGuidedUnavailableAsync(restrictedStudent, classRoot, courseId, optedInAssessmentId, sessionId, checkPath, payload);
    }

    private static async Task AssertGuidedUnavailableAsync(HttpClient client, string classRoot, string courseId,
        string assessmentId, string sessionId, string checkPath, object payload)
    {
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"{classRoot}/courses/{courseId}/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(
            $"{classRoot}/courses/{courseId}/assessments/{assessmentId}/learning-content")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync(
            $"{classRoot}/courses/{courseId}/assessments/{assessmentId}/sessions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"{classRoot}/sessions/{sessionId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync(checkPath, payload)).StatusCode);
    }

    private async Task<string> CreateClassroomAsync(HttpClient owner, string name) =>
        (await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name })))
        .GetProperty("id").GetString()!;

    private static async Task<string> InviteAndAcceptAsync(HttpClient owner, HttpClient invitee,
        string classroomId, string userId, string role)
    {
        var invitation = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId, role }));
        var membershipId = invitation.GetProperty("id").GetString()!;
        await DataAsync(await invitee.PostAsync($"/v1/education/memberships/{membershipId}/accept", null));
        return membershipId;
    }

    private static async Task<string> CreatePublishedAssessmentAsync(HttpClient owner, string courseId,
        string objectiveId, string title, bool publicPractice)
    {
        var assessment = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title }));
        var id = assessment.GetProperty("id").GetString()!;
        var updated = await DataAsync(await owner.PutAsJsonAsync($"/v1/education/assessments/{id}", new
        {
            expectedVersion = 1, title,
            questions = new[] { new { prompt = "Are cells basic units of life?", type = "true-false", maxScore = 1m,
                objectiveId, options = Array.Empty<object>(), correctBooleanAnswer = true,
                allowedTextAnswers = Array.Empty<string>(), allowedNumericAnswers = Array.Empty<decimal>(), explanation = "Cells are basic units of life." } }
        }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/assessments/{id}/publish",
            new { expectedVersion = updated.GetProperty("version").GetInt32(), isPublicPractice = publicPractice }));
        return id;
    }

    private async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Classroom guided test", email = $"classroom-guided-{Guid.NewGuid():N}@example.test", password = "password123"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        return account.GetProperty("user").GetProperty("id").GetString()!;
    }

    private async Task RegisterAdminAsync(HttpClient client)
    {
        var email = $"classroom-guided-admin-{Guid.NewGuid():N}@example.test";
        var registered = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Classroom guided admin", email, password = "password123"
        }));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(item => item.Id == registered.GetProperty("user").GetProperty("id").GetString());
            user.Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        var login = await DataAsync(await client.PostAsJsonAsync("/auth/login", new { email, password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("token").GetString());
    }

    private async Task SetRestrictedAsync(string userId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(item => item.Id == userId);
        user.AccountMode = AccountMode.RestrictedLearner;
        await db.SaveChangesAsync();
    }

    private async Task SetCourseHiddenAsync(string courseId, bool hidden)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var course = await db.EducationCourses.SingleAsync(item => item.Id == courseId);
        course.SetModerationHidden(hidden, hidden ? "integration test" : null, DateTime.UtcNow);
        await db.SaveChangesAsync();
    }

    private async Task<int> CountAsync(Func<AppDbContext, Task<int>> count)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        return await count(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
            throw new Xunit.Sdk.XunitException($"Expected success, got {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean(), envelope.GetProperty("message").GetString());
        return envelope.GetProperty("data").Clone();
    }
}
