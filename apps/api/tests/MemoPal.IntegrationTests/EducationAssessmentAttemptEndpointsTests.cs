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

public sealed class EducationAssessmentAttemptEndpointsTests(EducationAttemptsTestWebApplicationFactory factory)
    : IClassFixture<EducationAttemptsTestWebApplicationFactory>
{
    [Fact]
    public async Task Question_explanation_length_is_validated_before_draft_persistence()
    {
        using var teacher = factory.CreateClient();
        await RegisterAsync(teacher);
        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Science" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Plants" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title = "Quiz" }));
        var invalid = await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessment.GetProperty("id").GetString()}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(),
            title = "Quiz",
            questions = new[]
            {
                new { id = (string?)null, prompt = "True?", type = "true-false", maxScore = 1,
                    objectiveId = objective.GetProperty("id").GetString(), correctBooleanAnswer = true,
                    explanation = new string('x', 2001) }
            }
        });

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var unchanged = await DataAsync(await teacher.GetAsync($"/v1/education/courses/{courseId}/assessments"));
        var unchangedAssessment = Assert.Single(unchanged.EnumerateArray());
        Assert.Empty(unchangedAssessment.GetProperty("questions").EnumerateArray());
    }

    [Fact]
    public async Task WrittenResponseWaitsForAuthorizedManualGradeBeforeResultPublication()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);
        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Written response class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));

        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Writing" }));
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/objectives", new { title = "Explain" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/assessments", new { title = "Short response" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var draft = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(),
            title = "Short response",
            questions = new[]
            {
                new { id = (string?)null, prompt = "Explain why plants need sunlight.", type = "written-response", maxScore = 3,
                    objectiveId = objective.GetProperty("id").GetString(), gradingRubric = "Award up to 3 points for light as an energy source and its role in photosynthesis." },
                new { id = (string?)null, prompt = "Name one product of photosynthesis.", type = "written-response", maxScore = 2,
                    objectiveId = objective.GetProperty("id").GetString(), gradingRubric = "Award up to 2 points for naming glucose or oxygen." },
                new { id = (string?)null, prompt = "Show your work with a labelled photo.", type = "photo-response", maxScore = 2,
                    objectiveId = objective.GetProperty("id").GetString(), gradingRubric = "Award points for a legible and correctly labelled diagram." },
                new { id = (string?)null, prompt = "Explain your answer aloud.", type = "voice-response", maxScore = 2,
                    objectiveId = objective.GetProperty("id").GetString(), gradingRubric = "Award points for naming the key idea and explaining it clearly." }
            }
        }));
        await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = draft.GetProperty("version").GetInt32() }));
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "Explain plants", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddHours(1),
            idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        }));
        var assignmentId = assignment.GetProperty("id").GetString()!;
        var attempt = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
        var questions = attempt.GetProperty("questions").EnumerateArray().ToArray();
        Assert.Equal(4, questions.Length);
        Assert.Equal("written-response", questions[0].GetProperty("type").GetString());
        Assert.Equal("written-response", questions[1].GetProperty("type").GetString());
        Assert.Equal("photo-response", questions[2].GetProperty("type").GetString());
        Assert.Equal("voice-response", questions[3].GetProperty("type").GetString());
        Assert.All(questions, question => Assert.False(question.TryGetProperty("gradingRubric", out _)));
        var attemptId = attempt.GetProperty("id").GetString()!;
        var questionIds = questions.Select(question => question.GetProperty("id").GetString()!).ToArray();
        var answers = new[] { "Sunlight gives plants energy for photosynthesis.", "Photosynthesis produces glucose and oxygen." };
        var version = attempt.GetProperty("version").GetInt32();
        for (var index = 0; index < answers.Length; index++)
        {
            await DataAsync(await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
            {
                questionId = questionIds[index], expectedVersion = version++, clear = false,
                answer = new { type = "written-response", textValue = answers[index] }
            }));
        }
        var pngBytes = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9VEAAAAASUVORK5CYII=");
        using var photoForm = new MultipartFormDataContent();
        var photoPart = new ByteArrayContent(pngBytes);
        photoPart.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        photoForm.Add(photoPart, "file", "answer.png");
        photoForm.Add(new StringContent(version.ToString()), "expectedVersion");
        var uploaded = await DataAsync(await student.PostAsync(
            $"/v1/education/attempts/{attemptId}/responses/{questionIds[2]}/photo", photoForm));
        var attachmentId = uploaded.GetProperty("attachmentId").GetString()!;
        using (var invalidAudioForm = new MultipartFormDataContent())
        {
            var invalidAudioPart = new ByteArrayContent([1, 2, 3, 4]);
            invalidAudioPart.Headers.ContentType = new MediaTypeHeaderValue("audio/mp4");
            invalidAudioForm.Add(invalidAudioPart, "file", "not-audio.m4a");
            invalidAudioForm.Add(new StringContent((version + 1).ToString()), "expectedVersion");
            var invalidAudio = await student.PostAsync(
                $"/v1/education/attempts/{attemptId}/responses/{questionIds[3]}/audio", invalidAudioForm);
            Assert.Equal(HttpStatusCode.BadRequest, invalidAudio.StatusCode);
        }
        var audioBytes = new byte[] { 0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41, 0x20 };
        using var audioForm = new MultipartFormDataContent();
        var audioPart = new ByteArrayContent(audioBytes);
        audioPart.Headers.ContentType = new MediaTypeHeaderValue("audio/mp4");
        audioForm.Add(audioPart, "file", "answer.m4a");
        audioForm.Add(new StringContent((version + 1).ToString()), "expectedVersion");
        var uploadedAudio = await DataAsync(await student.PostAsync(
            $"/v1/education/attempts/{attemptId}/responses/{questionIds[3]}/audio", audioForm));
        var audioAttachmentId = uploadedAudio.GetProperty("attachmentId").GetString()!;
        var submitted = await DataAsync(await student.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));
        Assert.True(submitted.GetProperty("manualGradingPending").GetBoolean());
        Assert.Equal(JsonValueKind.Null, submitted.GetProperty("score").ValueKind);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assigned = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assigned.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Conflict,
            (await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(
            $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/responses/{questionIds[0]}/grade", new { score = 2, feedback = "Clear." })).StatusCode);
        var gradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        var row = Assert.Single(gradebook.GetProperty("students").EnumerateArray());
        Assert.Equal("awaiting-manual-grade", row.GetProperty("status").GetString());
        var manualResponses = row.GetProperty("manualResponses").EnumerateArray().ToArray();
        Assert.Equal(4, manualResponses.Length);
        Assert.Equal(answers.ToHashSet(), manualResponses.Where(response => response.GetProperty("answer").ValueKind == JsonValueKind.String)
            .Select(response => response.GetProperty("answer").GetString()!).ToHashSet());
        Assert.Equal(attachmentId, manualResponses.Single(response => response.GetProperty("questionId").GetString() == questionIds[2])
            .GetProperty("photoAttachmentId").GetString());
        Assert.Equal(audioAttachmentId, manualResponses.Single(response => response.GetProperty("questionId").GetString() == questionIds[3])
            .GetProperty("audioAttachmentId").GetString());
        Assert.All(manualResponses, response => Assert.Contains("Award", response.GetProperty("rubric").GetString()));

        var photoUrl = $"/v1/education/attempts/{attemptId}/responses/{questionIds[2]}/photos/{attachmentId}";
        using (var forbiddenPhoto = await stranger.GetAsync(photoUrl)) Assert.Equal(HttpStatusCode.NotFound, forbiddenPhoto.StatusCode);
        using (var studentPhoto = await student.GetAsync(photoUrl))
        {
            Assert.Equal(HttpStatusCode.OK, studentPhoto.StatusCode);
            Assert.Equal("image/png", studentPhoto.Content.Headers.ContentType?.MediaType);
            Assert.Equal(pngBytes, await studentPhoto.Content.ReadAsByteArrayAsync());
        }
        using (var teacherPhoto = await teacher.GetAsync(photoUrl))
        {
            Assert.Equal(HttpStatusCode.OK, teacherPhoto.StatusCode);
            Assert.Equal(pngBytes, await teacherPhoto.Content.ReadAsByteArrayAsync());
        }
        var audioUrl = $"/v1/education/attempts/{attemptId}/responses/{questionIds[3]}/attachments/{audioAttachmentId}";
        using (var forbiddenAudio = await stranger.GetAsync(audioUrl)) Assert.Equal(HttpStatusCode.NotFound, forbiddenAudio.StatusCode);
        using (var studentAudio = await student.GetAsync(audioUrl))
        {
            Assert.Equal(HttpStatusCode.OK, studentAudio.StatusCode);
            Assert.Equal("audio/mp4", studentAudio.Content.Headers.ContentType?.MediaType);
            Assert.Equal(audioBytes, await studentAudio.Content.ReadAsByteArrayAsync());
        }
        using (var teacherAudio = await teacher.GetAsync(audioUrl))
        {
            Assert.Equal(HttpStatusCode.OK, teacherAudio.StatusCode);
            Assert.Equal(audioBytes, await teacherAudio.Content.ReadAsByteArrayAsync());
        }

        var grades = new[]
        {
            (QuestionId: questionIds[0], Score: 2.5m, Feedback: "Good explanation."),
            (QuestionId: questionIds[1], Score: 2m, Feedback: "Correct product."),
            (QuestionId: questionIds[2], Score: 1.5m, Feedback: "Clear diagram."),
            (QuestionId: questionIds[3], Score: 1.5m, Feedback: "Good explanation.")
        };
        var gradeRequests = grades.Select(grade => teacher.PostAsJsonAsync(
            $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/responses/{grade.QuestionId}/grade",
            new { score = grade.Score, feedback = grade.Feedback })).ToArray();
        var concurrentResponses = await Task.WhenAll(gradeRequests);
        var finalized = new HashSet<string>();
        for (var index = 0; index < concurrentResponses.Length; index++)
        {
            var response = concurrentResponses[index];
            if (response.IsSuccessStatusCode)
            {
                var result = await DataAsync(response);
                if (result.GetProperty("attemptFullyGraded").GetBoolean()) finalized.Add(grades[index].QuestionId);
                continue;
            }
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var retry = await DataAsync(await teacher.PostAsJsonAsync(
                $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/responses/{grades[index].QuestionId}/grade",
                new { score = grades[index].Score, feedback = grades[index].Feedback }));
            if (retry.GetProperty("attemptFullyGraded").GetBoolean()) finalized.Add(grades[index].QuestionId);
        }
        Assert.Single(finalized);

        var ready = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        Assert.Equal("submitted", Assert.Single(ready.GetProperty("students").EnumerateArray()).GetProperty("status").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await teacher.PostAsJsonAsync(
            $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/responses/{questionIds[0]}/grade", new { score = 3, feedback = "Second grade." })).StatusCode);

        var unpublished = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.Equal(JsonValueKind.Null, unpublished.GetProperty("score").ValueKind);
        Assert.Equal(JsonValueKind.Null, unpublished.GetProperty("resultsPublishedAt").ValueKind);
        Assert.All(unpublished.GetProperty("responses").EnumerateArray(), response =>
        {
            Assert.Equal(JsonValueKind.Null, response.GetProperty("score").ValueKind);
            Assert.Equal(JsonValueKind.Null, response.GetProperty("feedback").ValueKind);
        });

        await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));
        var released = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.Equal(7.5m, released.GetProperty("score").GetDecimal());
        var releasedResponses = released.GetProperty("responses").EnumerateArray().ToArray();
        Assert.Equal(4, releasedResponses.Length);
        Assert.Equal(new decimal[] { 1.5m, 1.5m, 2m, 2.5m }, releasedResponses.Select(response => response.GetProperty("score").GetDecimal()).Order().ToArray());
        Assert.Equal(new[] { "Clear diagram.", "Correct product.", "Good explanation." , "Good explanation." }, releasedResponses.Select(response => response.GetProperty("feedback").GetString()).Order().ToArray());
    }

    [Fact]
    public async Task StudentLeaderboardUsesFrozenPseudonymousRowsAndPerStudentConsent()
    {
        using var teacher = factory.CreateClient();
        using var firstStudent = factory.CreateClient();
        using var secondStudent = factory.CreateClient();
        using var optedOutStudent = factory.CreateClient();
        await RegisterAsync(teacher);
        var firstId = await RegisterAsync(firstStudent);
        var secondId = await RegisterAsync(secondStudent);
        var optedOutId = await RegisterAsync(optedOutStudent);

        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Leaderboard class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        foreach (var (client, studentId) in new[] { (firstStudent, firstId), (secondStudent, secondId), (optedOutStudent, optedOutId) })
        {
            var invitation = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
            await DataAsync(await client.PostAsync($"/v1/education/memberships/{invitation.GetProperty("id").GetString()}/accept", null));
        }

        var assessmentId = await CreatePublishedAssessmentAsync(teacher);
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId,
            title = "Opt-in leaderboard",
            opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddHours(1),
            timeLimitMinutes = (int?)null,
            idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { firstId, secondId, optedOutId },
            enableStudentLeaderboard = true
        }));
        var assignmentId = assignment.GetProperty("id").GetString()!;
        Assert.True(assignment.GetProperty("studentLeaderboardEnabled").GetBoolean());

        foreach (var (client, include) in new[] { (firstStudent, true), (secondStudent, true), (optedOutStudent, false) })
            await DataAsync(await client.PutAsJsonAsync($"/v1/education/assignments/{assignmentId}/leaderboard-preference", new { includeInLeaderboard = include }));

        foreach (var (client, isCorrect) in new[] { (firstStudent, true), (secondStudent, true), (optedOutStudent, false) })
        {
            var attempt = await DataAsync(await client.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
            await DataAsync(await client.PutAsJsonAsync($"/v1/education/attempts/{attempt.GetProperty("id").GetString()}/responses", new
            {
                questionId = attempt.GetProperty("questions")[0].GetProperty("id").GetString(),
                expectedVersion = attempt.GetProperty("version").GetInt32(),
                clear = false,
                answer = new { type = "true-false", booleanValue = isCorrect }
            }));
            await DataAsync(await client.PostAsync($"/v1/education/attempts/{attempt.GetProperty("id").GetString()}/submit", null));
        }

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assigned = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assigned.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));

        var board = await DataAsync(await firstStudent.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.True(board.GetProperty("fullLeaderboardEnabled").GetBoolean());
        Assert.Equal(3, board.GetProperty("rankedParticipantCount").GetInt32());
        Assert.Equal(1, board.GetProperty("myRank").GetInt32());
        var entries = board.GetProperty("visibleEntries").EnumerateArray().ToArray();
        Assert.Equal(2, entries.Length);
        Assert.All(entries, row => Assert.Equal(1, row.GetProperty("rank").GetInt32()));
        Assert.Equal(2, entries.Select(row => row.GetProperty("alias").GetString()).Distinct().Count());
        Assert.DoesNotContain(firstId, board.ToString(), StringComparison.Ordinal);
        Assert.DoesNotContain(secondId, board.ToString(), StringComparison.Ordinal);
        Assert.DoesNotContain(optedOutId, board.ToString(), StringComparison.Ordinal);

        var optedOutBoard = await DataAsync(await optedOutStudent.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(3, optedOutBoard.GetProperty("myRank").GetInt32());
        Assert.DoesNotContain(optedOutId, optedOutBoard.ToString(), StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Conflict,
            (await optedOutStudent.PutAsJsonAsync($"/v1/education/assignments/{assignmentId}/leaderboard-preference", new { includeInLeaderboard = true })).StatusCode);
    }

    [Fact]
    public async Task StudentStartsSavesSubmitsAndCannotReadOtherStudentsAttemptOrAnswerKey()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        using var otherStudent = factory.CreateClient();
        using var parent = factory.CreateClient();
        var teacherId = await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(otherStudent);
        var parentId = await RegisterAsync(parent);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.EducationGuardianLinks.Add(new EducationGuardianLink
            {
                GuardianUserId = parentId,
                StudentUserId = studentId,
                Status = EducationRelationshipStatuses.Active,
                StudentConfirmedAt = DateTime.UtcNow,
                AdminVerifiedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Attempt class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));
        var assessmentId = await CreatePublishedAssessmentAsync(teacher);
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId,
            title = "Attempt test",
            opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddHours(1),
            timeLimitMinutes = 30,
            idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { studentId }
        }));
        var assignmentId = assignment.GetProperty("id").GetString()!;

        var startResponse = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
        var attemptId = startResponse.GetProperty("id").GetString()!;
        var repeatedStart = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
        Assert.Equal(attemptId, repeatedStart.GetProperty("id").GetString());
        Assert.False(startResponse.GetProperty("resultPublished").GetBoolean());
        Assert.False(startResponse.ToString().Contains("correctBooleanAnswer", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(HttpStatusCode.NotFound, (await otherStudent.GetAsync($"/v1/education/attempts/{attemptId}")).StatusCode);

        var question = Assert.Single(startResponse.GetProperty("questions").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, question.GetProperty("explanation").ValueKind);
        var saved = await DataAsync(await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
        {
            questionId = question.GetProperty("id").GetString(),
            expectedVersion = startResponse.GetProperty("version").GetInt32(),
            clear = false,
            answer = new { type = "true-false", booleanValue = true }
        }));
        var result = await DataAsync(await student.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));
        var repeatedSubmit = await DataAsync(await student.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));

        Assert.Equal(startResponse.GetProperty("version").GetInt32() + 1, saved.GetProperty("version").GetInt32());
        Assert.Equal("submitted", result.GetProperty("status").GetString());
        Assert.False(result.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(result.GetProperty("submittedAt").GetString(), repeatedSubmit.GetProperty("submittedAt").GetString());
        Assert.Equal(JsonValueKind.Null, result.GetProperty("score").ValueKind);
        Assert.False(result.ToString().Contains("correctBooleanAnswer", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(HttpStatusCode.NotFound,
            (await otherStudent.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook")).StatusCode);
        var linkedChildren = await DataAsync(await parent.GetAsync("/v1/education/family/children"));
        Assert.Equal(studentId, Assert.Single(linkedChildren.EnumerateArray()).GetProperty("studentUserId").GetString());
        Assert.Equal(HttpStatusCode.NotFound,
            (await otherStudent.GetAsync($"/v1/education/family/children/{studentId}/report")).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict,
            (await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null)).StatusCode);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assignedTask = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assignedTask.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }

        var gradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        var gradeRow = Assert.Single(gradebook.GetProperty("students").EnumerateArray());
        Assert.Equal("submitted", gradeRow.GetProperty("status").GetString());
        Assert.Equal(1m, gradeRow.GetProperty("score").GetDecimal());
        var privateFamilyReport = await DataAsync(await parent.GetAsync($"/v1/education/family/children/{studentId}/report"));
        var privateFamilyAssignment = Assert.Single(privateFamilyReport.GetProperty("assignments").EnumerateArray());
        Assert.False(privateFamilyAssignment.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(JsonValueKind.Null, privateFamilyAssignment.GetProperty("score").ValueKind);
        Assert.Equal(JsonValueKind.Null, privateFamilyAssignment.GetProperty("selectedResponsePerformance").GetProperty("score").ValueKind);
        var unpublishedPractice = await student.PostAsJsonAsync($"/v1/education/attempts/{attemptId}/practice-check", new
        {
            questionId = question.GetProperty("id").GetString(),
            answer = new { type = "true-false", booleanValue = true }
        });
        Assert.Equal(HttpStatusCode.Conflict, unpublishedPractice.StatusCode);
        var publication = await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));
        Assert.Equal(assignmentId, publication.GetProperty("assignmentId").GetString());
        var repeatedPublication = await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));
        Assert.Equal(publication.GetProperty("resultsPublishedAt").GetString(), repeatedPublication.GetProperty("resultsPublishedAt").GetString());
        var publishedAttempt = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.True(publishedAttempt.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(publication.GetProperty("resultsPublishedAt").GetString(), publishedAttempt.GetProperty("resultsPublishedAt").GetString());
        Assert.Equal(1m, publishedAttempt.GetProperty("score").GetDecimal());
        Assert.Equal(1m, publishedAttempt.GetProperty("maxScore").GetDecimal());
        Assert.Equal("Plants make their own food using light.", Assert.Single(publishedAttempt.GetProperty("questions").EnumerateArray()).GetProperty("explanation").GetString());
        var practiceResponse = await student.PostAsJsonAsync($"/v1/education/attempts/{attemptId}/practice-check", new
        {
            questionId = question.GetProperty("id").GetString(),
            answer = new { type = "true-false", booleanValue = true }
        });
        Assert.Equal(HttpStatusCode.OK, practiceResponse.StatusCode);
        var practiceCheck = await DataAsync(practiceResponse);
        Assert.True(practiceCheck.GetProperty("isCorrect").GetBoolean());
        Assert.Equal(1m, practiceCheck.GetProperty("score").GetDecimal());
        var practiceItems = await DataAsync(await student.GetAsync("/v1/education/practice/items"));
        var practiceItem = Assert.Single(practiceItems.EnumerateArray());
        Assert.Equal(attemptId, practiceItem.GetProperty("attemptId").GetString());
        Assert.Equal(1, practiceItem.GetProperty("questionCount").GetInt32());
        Assert.DoesNotContain("answerKey", practiceItem.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.Empty((await DataAsync(await otherStudent.GetAsync("/v1/education/practice/items"))).EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound,
            (await otherStudent.PostAsJsonAsync($"/v1/education/attempts/{attemptId}/practice-check", new
            {
                questionId = question.GetProperty("id").GetString(),
                answer = new { type = "true-false", booleanValue = true }
            })).StatusCode);
        var attemptAfterPractice = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.Equal(1m, attemptAfterPractice.GetProperty("score").GetDecimal());
        Assert.Equal(publishedAttempt.GetProperty("version").GetInt32(), attemptAfterPractice.GetProperty("version").GetInt32());
        Assert.Equal(publishedAttempt.GetProperty("responses").GetRawText(), attemptAfterPractice.GetProperty("responses").GetRawText());
        var publishedRank = await DataAsync(await student.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(1m, publishedRank.GetProperty("myScore").GetDecimal());
        var publishedFamilyReport = await DataAsync(await parent.GetAsync($"/v1/education/family/children/{studentId}/report"));
        var publishedFamilyAssignment = Assert.Single(publishedFamilyReport.GetProperty("assignments").EnumerateArray());
        Assert.True(publishedFamilyAssignment.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(1m, publishedFamilyAssignment.GetProperty("score").GetDecimal());
        Assert.Equal(1m, publishedFamilyAssignment.GetProperty("selectedResponsePerformance").GetProperty("score").GetDecimal());
        Assert.Equal(1m, publishedFamilyAssignment.GetProperty("selectedResponsePerformance").GetProperty("maxScore").GetDecimal());
        Assert.Equal(JsonValueKind.Null, publishedFamilyAssignment.GetProperty("openResponsePerformance").GetProperty("score").ValueKind);

        Assert.Equal(HttpStatusCode.NotFound, (await student.PostAsJsonAsync(
            $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/correct-grade", new { score = 0, reason = "Student cannot change a grade." })).StatusCode);
        var correction = await DataAsync(await teacher.PostAsJsonAsync(
            $"/v1/education/assignments/{assignmentId}/attempts/{attemptId}/correct-grade", new { score = 0, reason = "  Answer key was reviewed.  " }));
        Assert.Equal(0m, correction.GetProperty("score").GetDecimal());
        Assert.Equal(JsonValueKind.Null, correction.GetProperty("resultsPublishedAt").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound,
            (await student.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard")).StatusCode);
        var hiddenAfterCorrection = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.False(hiddenAfterCorrection.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(JsonValueKind.Null, hiddenAfterCorrection.GetProperty("resultsPublishedAt").ValueKind);
        Assert.Equal(JsonValueKind.Null, hiddenAfterCorrection.GetProperty("score").ValueKind);
        Assert.Equal(JsonValueKind.Null, Assert.Single(hiddenAfterCorrection.GetProperty("questions").EnumerateArray()).GetProperty("explanation").ValueKind);
        Assert.Empty((await DataAsync(await student.GetAsync("/v1/education/practice/items"))).EnumerateArray());
        var correctedFamilyReport = await DataAsync(await parent.GetAsync($"/v1/education/family/children/{studentId}/report"));
        Assert.False(Assert.Single(correctedFamilyReport.GetProperty("assignments").EnumerateArray()).GetProperty("resultPublished").GetBoolean());
        var correctedGradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        var correctedRow = Assert.Single(correctedGradebook.GetProperty("students").EnumerateArray());
        Assert.Equal(0m, correctedRow.GetProperty("score").GetDecimal());
        Assert.Equal(1, correctedRow.GetProperty("gradeRevisionCount").GetInt32());
        var gradeRevision = Assert.Single(correctedRow.GetProperty("gradeRevisions").EnumerateArray());
        Assert.Equal("Answer key was reviewed.", gradeRevision.GetProperty("reason").GetString());
        Assert.Equal(teacherId, gradeRevision.GetProperty("correctedByUserId").GetString());
        var republished = await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{assignmentId}/publish-results", null));
        Assert.Equal(assignmentId, republished.GetProperty("assignmentId").GetString());
        var releasedCorrection = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        Assert.True(releasedCorrection.GetProperty("resultPublished").GetBoolean());
        Assert.Equal(republished.GetProperty("resultsPublishedAt").GetString(), releasedCorrection.GetProperty("resultsPublishedAt").GetString());
        Assert.NotEqual(publication.GetProperty("resultsPublishedAt").GetString(), republished.GetProperty("resultsPublishedAt").GetString());
        Assert.Equal(0m, releasedCorrection.GetProperty("score").GetDecimal());
        var correctedPublishedFamilyReport = await DataAsync(await parent.GetAsync($"/v1/education/family/children/{studentId}/report"));
        var correctedPublishedFamilyAssignment = Assert.Single(correctedPublishedFamilyReport.GetProperty("assignments").EnumerateArray());
        Assert.Equal(0m, correctedPublishedFamilyAssignment.GetProperty("score").GetDecimal());
        Assert.Equal(JsonValueKind.Null, correctedPublishedFamilyAssignment.GetProperty("selectedResponsePerformance").GetProperty("score").ValueKind);
        var republishedRank = await DataAsync(await student.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(0m, republishedRank.GetProperty("myScore").GetDecimal());
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var audit = await db.EducationGradeRevisions.SingleAsync(x => x.AttemptId == attemptId);
            Assert.Equal(teacherId, audit.CorrectedByUserId);
            Assert.Equal("Answer key was reviewed.", audit.Reason);
            Assert.NotNull(audit.PreviousResultsPublishedAt);
            Assert.Equal(2, await db.EducationAssignmentLeaderboardEntries.CountAsync(x => x.AssignmentId == assignmentId));
        }
    }

    [Fact]
    public async Task MultipleSelectQuestionCanBeAuthoredSavedRestoredAndScoredByExactOptionSet()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        var studentId = await RegisterAsync(student);
        await RegisterAsync(teacher);
        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Multi-select class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));

        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Ecology" }));
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/objectives", new { title = "Living things" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/assessments", new { title = "Living things quiz" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var options = new[]
        {
            new { id = "plant", label = "Plant" },
            new { id = "animal", label = "Animal" },
            new { id = "rock", label = "Rock" }
        };
        var draft = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(),
            title = "Living things quiz",
            questions = new[]
            {
                new { id = (string?)null, prompt = "Select all living things.", type = "multiple-select", fillMode = (string?)null,
                    maxScore = 2, objectiveId = objective.GetProperty("id").GetString(), options,
                    correctOptionIds = new[] { "plant", "animal" } }
            }
        }));
        await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = draft.GetProperty("version").GetInt32() }));
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "Select the living things", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddHours(1),
            idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        }));
        var assignmentId = assignment.GetProperty("id").GetString()!;
        var attempt = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
        Assert.Equal("multiple-select", Assert.Single(attempt.GetProperty("questions").EnumerateArray()).GetProperty("type").GetString());
        Assert.DoesNotContain("correctOptionIds", attempt.ToString(), StringComparison.OrdinalIgnoreCase);
        var questionId = Assert.Single(attempt.GetProperty("questions").EnumerateArray()).GetProperty("id").GetString()!;
        await DataAsync(await student.PutAsJsonAsync($"/v1/education/attempts/{attempt.GetProperty("id").GetString()}/responses", new
        {
            questionId, expectedVersion = attempt.GetProperty("version").GetInt32(), clear = false,
            answer = new { type = "multiple-select", optionIds = new[] { "animal", "plant" } }
        }));
        var restored = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attempt.GetProperty("id").GetString()}"));
        var restoredAnswer = Assert.Single(restored.GetProperty("responses").EnumerateArray()).GetProperty("answer");
        Assert.Equal(new[] { "animal", "plant" }, restoredAnswer.GetProperty("optionIds").EnumerateArray().Select(x => x.GetString()).ToArray());
        await DataAsync(await student.PostAsync($"/v1/education/attempts/{attempt.GetProperty("id").GetString()}/submit", null));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assignedTask = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assignedTask.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        var gradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        Assert.Equal(2m, Assert.Single(gradebook.GetProperty("students").EnumerateArray()).GetProperty("score").GetDecimal());
    }

    [Fact]
    public async Task OrderingQuestionCanBeAuthoredSavedRestoredAndScoredWithoutExposingTheKey()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        var studentId = await RegisterAsync(student);
        await RegisterAsync(teacher);
        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Ordering class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));

        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "History" }));
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/objectives", new { title = "Timeline" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/assessments", new { title = "Put events in order" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var options = new[]
        {
            new { id = "event-b", label = "Middle event" },
            new { id = "event-c", label = "Last event" },
            new { id = "event-a", label = "First event" }
        };
        var draft = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(),
            title = "Put events in order",
            questions = new[]
            {
                new { id = (string?)null, prompt = "Order the events.", type = "ordering", maxScore = 3,
                    objectiveId = objective.GetProperty("id").GetString(), options,
                    correctSequenceIds = new[] { "event-a", "event-b", "event-c" } }
            }
        }));
        await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = draft.GetProperty("version").GetInt32() }));
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "Timeline task", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddHours(1),
            idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        }));
        var assignmentId = assignment.GetProperty("id").GetString()!;
        var attempt = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignmentId}/attempts", null));
        var studentQuestion = Assert.Single(attempt.GetProperty("questions").EnumerateArray());
        Assert.Equal("ordering", studentQuestion.GetProperty("type").GetString());
        Assert.False(studentQuestion.TryGetProperty("correctSequenceIds", out _));
        var attemptId = attempt.GetProperty("id").GetString()!;
        var questionId = studentQuestion.GetProperty("id").GetString()!;

        var invalid = await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
        {
            questionId, expectedVersion = attempt.GetProperty("version").GetInt32(), clear = false,
            answer = new { type = "ordering", orderedOptionIds = new[] { "event-a", "event-a", "event-c" } }
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var saved = await DataAsync(await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
        {
            questionId, expectedVersion = attempt.GetProperty("version").GetInt32(), clear = false,
            answer = new { type = "ordering", orderedOptionIds = new[] { "event-a", "event-b", "event-c" } }
        }));
        var restored = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        var restoredAnswer = Assert.Single(restored.GetProperty("responses").EnumerateArray()).GetProperty("answer");
        Assert.Equal(new[] { "event-a", "event-b", "event-c" },
            restoredAnswer.GetProperty("orderedOptionIds").EnumerateArray().Select(item => item.GetString()).ToArray());
        await DataAsync(await student.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assignedTask = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assignedTask.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        var gradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignmentId}/gradebook"));
        Assert.Equal(3m, Assert.Single(gradebook.GetProperty("students").EnumerateArray()).GetProperty("score").GetDecimal());
        Assert.Equal(attemptId, saved.GetProperty("attemptId").GetString());
    }

    [Fact]
    public async Task MatchingQuestionKeepsItsKeyPrivateAndAwardsPartialPairCredit()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        var studentId = await RegisterAsync(student);
        await RegisterAsync(teacher);
        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Matching class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));

        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Vocabulary" }));
        var objective = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/objectives", new { title = "Word pairs" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/assessments", new { title = "Match the words" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var pairs = new[]
        {
            new { left = new { id = "left-cat", label = "Cat" }, right = new { id = "right-animal", label = "Animal" } },
            new { left = new { id = "left-red", label = "Red" }, right = new { id = "right-color", label = "Color" } }
        };
        var draft = await DataAsync(await teacher.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(), title = "Match the words",
            questions = new[]
            {
                new { id = (string?)null, prompt = "Match each item.", type = "matching", maxScore = 3,
                    objectiveId = objective.GetProperty("id").GetString(), matchingPairs = pairs }
            }
        }));
        var authorQuestion = Assert.Single(draft.GetProperty("questions").EnumerateArray());
        Assert.Equal(2, authorQuestion.GetProperty("matchingPairs").GetArrayLength());
        await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = draft.GetProperty("version").GetInt32() }));
        var assignment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "Matching task", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddHours(1),
            idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        }));
        var attempt = await DataAsync(await student.PostAsync($"/v1/education/assignments/{assignment.GetProperty("id").GetString()}/attempts", null));
        var question = Assert.Single(attempt.GetProperty("questions").EnumerateArray());
        Assert.Equal("matching", question.GetProperty("type").GetString());
        Assert.Equal(2, question.GetProperty("options").GetArrayLength());
        Assert.Equal(2, question.GetProperty("matchTargets").GetArrayLength());
        Assert.False(question.TryGetProperty("matchingPairs", out _));
        Assert.False(question.TryGetProperty("correctMatches", out _));
        var attemptId = attempt.GetProperty("id").GetString()!;
        var questionId = question.GetProperty("id").GetString()!;

        var invalid = await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
        {
            questionId, expectedVersion = attempt.GetProperty("version").GetInt32(), clear = false,
            answer = new { type = "matching", matches = new[]
            {
                new { leftOptionId = "left-cat", matchTargetId = "right-animal" },
                new { leftOptionId = "left-red", matchTargetId = "right-animal" }
            } }
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        await DataAsync(await student.PutAsJsonAsync($"/v1/education/attempts/{attemptId}/responses", new
        {
            questionId, expectedVersion = attempt.GetProperty("version").GetInt32(), clear = false,
            answer = new { type = "matching", matches = new[]
            {
                new { leftOptionId = "left-cat", matchTargetId = "right-animal" }
            } }
        }));
        var restored = await DataAsync(await student.GetAsync($"/v1/education/attempts/{attemptId}"));
        var savedAnswer = Assert.Single(restored.GetProperty("responses").EnumerateArray()).GetProperty("answer");
        Assert.Equal("left-cat", Assert.Single(savedAnswer.GetProperty("matches").EnumerateArray()).GetProperty("leftOptionId").GetString());
        await DataAsync(await student.PostAsync($"/v1/education/attempts/{attemptId}/submit", null));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assignedTask = await db.EducationAssignments.SingleAsync(x => x.Id == assignment.GetProperty("id").GetString());
            assignedTask.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        var gradebook = await DataAsync(await teacher.GetAsync($"/v1/education/assignments/{assignment.GetProperty("id").GetString()}/gradebook"));
        Assert.Equal(1.5m, Assert.Single(gradebook.GetProperty("students").EnumerateArray()).GetProperty("score").GetDecimal());
    }

    private static async Task<string> CreatePublishedAssessmentAsync(HttpClient client)
    {
        var course = await DataAsync(await client.PostAsJsonAsync("/v1/education/courses", new { title = "Science" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await client.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Biology" }));
        var assessment = await DataAsync(await client.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title = "Quiz" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var updated = await DataAsync(await client.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = assessment.GetProperty("version").GetInt32(),
            title = "Quiz",
            questions = new[]
            {
                new { id = (string?)null, prompt = "A plant is living.", type = "true-false", fillMode = (string?)null,
                    maxScore = 1, objectiveId = objective.GetProperty("id").GetString(), correctBooleanAnswer = true,
                    explanation = "Plants make their own food using light." }
            }
        }));
        await DataAsync(await client.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = updated.GetProperty("version").GetInt32() }));
        return assessmentId;
    }

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Attempt tester",
            email = $"attempt-{Guid.NewGuid():N}@example.com",
            password = "password123"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        return account.GetProperty("user").GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"HTTP {(int)response.StatusCode}: {content}");
        var envelope = JsonDocument.Parse(content).RootElement;
        Assert.True(envelope.GetProperty("success").GetBoolean(), content);
        return envelope.GetProperty("data").Clone();
    }
}
