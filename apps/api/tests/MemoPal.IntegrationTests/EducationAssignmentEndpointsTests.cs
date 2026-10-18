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

public sealed class EducationAssignmentEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Verified_guardian_can_assign_published_practice_and_list_only_own_family_assignments()
    {
        using var guardian = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(guardian);
        var studentId = await RegisterAsync(student);
        var strangerId = await RegisterAsync(stranger);

        var link = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/guardian-links", new { studentUserId = studentId }));
        var linkId = link.GetProperty("id").GetString()!;
        await DataAsync(await student.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var guardianLink = await db.EducationGuardianLinks.SingleAsync(x => x.Id == linkId);
            guardianLink.AdminVerifiedAt = DateTime.UtcNow;
            guardianLink.Status = EducationRelationshipStatuses.Active;
            await db.SaveChangesAsync();
        }

        var assessmentId = await CreatePublishedAssessmentAsync(guardian);
        var request = new
        {
            assessmentId,
            title = "Evening practice",
            opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddDays(2),
            timeLimitMinutes = (int?)null,
            idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { studentId }
        };
        var created = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/assignments/family", request));
        Assert.Equal("family", created.GetProperty("scope").GetString());
        var repeated = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/assignments/family", request));
        Assert.Equal(created.GetProperty("id").GetString(), repeated.GetProperty("id").GetString());

        var ownAssignments = await DataAsync(await guardian.GetAsync("/v1/education/family/assignments"));
        Assert.Equal(created.GetProperty("id").GetString(), Assert.Single(ownAssignments.EnumerateArray()).GetProperty("id").GetString());
        Assert.Empty((await DataAsync(await stranger.GetAsync("/v1/education/family/assignments"))).EnumerateArray());
        Assert.Equal(created.GetProperty("id").GetString(), Assert.Single((await DataAsync(await student.GetAsync("/v1/education/my/assignments"))).EnumerateArray()).GetProperty("id").GetString());
        var familyGradebook = await DataAsync(await guardian.GetAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/gradebook"));
        Assert.Equal(studentId, Assert.Single(familyGradebook.GetProperty("students").EnumerateArray()).GetProperty("studentUserId").GetString());
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/gradebook")).StatusCode);

        var unauthorizedRecipient = new
        {
            request.assessmentId,
            request.title,
            request.opensAt,
            request.dueAt,
            request.timeLimitMinutes,
            idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { strangerId }
        };
        Assert.Equal(HttpStatusCode.NotFound,
            (await guardian.PostAsJsonAsync("/v1/education/assignments/family", unauthorizedRecipient)).StatusCode);
    }

    [Fact]
    public async Task Published_assessment_can_be_assigned_idempotently_to_active_class_students()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);

        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Science" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));

        var assessmentId = await CreatePublishedAssessmentAsync(teacher);
        var request = new
        {
            assessmentId,
            title = "Week 1 check",
            opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddDays(2),
            timeLimitMinutes = 20,
            idempotencyKey = Guid.NewGuid().ToString("N"),
            studentUserIds = new[] { studentId }
        };
        var created = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", request));
        var repeated = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", request));
        Assert.Equal(created.GetProperty("id").GetString(), repeated.GetProperty("id").GetString());
        Assert.Equal(1, created.GetProperty("recipients").GetArrayLength());
        Assert.Equal(studentId, created.GetProperty("recipients")[0].GetProperty("studentUserId").GetString());

        var changed = new
        {
            request.assessmentId,
            title = "Changed title",
            request.opensAt,
            request.dueAt,
            request.timeLimitMinutes,
            request.idempotencyKey,
            request.studentUserIds
        };
        Assert.Equal(HttpStatusCode.Conflict,
            (await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", changed)).StatusCode);

        var studentTasks = await DataAsync(await student.GetAsync("/v1/education/my/assignments"));
        var task = Assert.Single(studentTasks.EnumerateArray());
        Assert.Equal("Week 1 check", task.GetProperty("title").GetString());
        Assert.False(string.IsNullOrWhiteSpace(task.GetProperty("courseId").GetString()));
        Assert.Equal("Biology", task.GetProperty("courseTitle").GetString());
        Assert.False(task.TryGetProperty("correctBooleanAnswer", out _));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assessment = await db.EducationAssessments.SingleAsync(item => item.Id == assessmentId);
            var course = await db.EducationCourses.SingleAsync(item => item.Id == assessment.CourseId);
            assessment.IsDeleted = true;
            course.IsDeleted = true;
            await db.SaveChangesAsync();
        }
        var archivedCourseTask = Assert.Single((await DataAsync(await student.GetAsync("/v1/education/my/assignments"))).EnumerateArray());
        Assert.Equal("Week 1 check", archivedCourseTask.GetProperty("title").GetString());
        Assert.Equal(JsonValueKind.Null, archivedCourseTask.GetProperty("courseId").ValueKind);
        Assert.Equal(JsonValueKind.Null, archivedCourseTask.GetProperty("courseTitle").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.CreateClient().GetAsync("/v1/education/my/assignments")).StatusCode);
    }

    [Fact]
    public async Task Teacher_can_authorize_a_separate_audited_retake_without_replacing_the_original_result()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        var teacherId = await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        var strangerId = await RegisterAsync(stranger);

        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Retake class" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invitation = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invitation.GetProperty("id").GetString()}/accept", null));
        var assessmentId = await CreatePublishedAssessmentAsync(teacher);
        EducationAssignment original;
        EducationAssessmentAttempt originalAttempt;
        DateTime originalPublishedAt;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assessment = await db.EducationAssessments.Include(x => x.Questions)
                .SingleAsync(x => x.Id == assessmentId);
            original = CreateAssignment(teacherId, classroomId, assessment, [studentId], "Cell quiz");
            db.EducationAssignments.Add(original);
            originalAttempt = AddAttempt(db, original.Recipients.Single(), assessment, DateTime.UtcNow.AddMinutes(-1), [0m]);
            await db.SaveChangesAsync();
        }

        var request = new
        {
            studentUserId = studentId,
            reason = "The learner was absent during the original assessment window.",
            opensAt = DateTime.UtcNow.AddMinutes(-1),
            dueAt = DateTime.UtcNow.AddDays(2),
            timeLimitMinutes = 20,
            idempotencyKey = Guid.NewGuid().ToString("N")
        };
        Assert.Equal(HttpStatusCode.Conflict,
            (await teacher.PostAsJsonAsync($"/v1/education/assignments/{original.Id}/retakes", request)).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var persisted = await db.EducationAssignments.SingleAsync(x => x.Id == original.Id);
            persisted.PublishResults(DateTime.UtcNow.AddSeconds(-30));
            await db.SaveChangesAsync();
            originalPublishedAt = persisted.ResultsPublishedAt!.Value;
        }
        var wrongRecipient = new
        {
            studentUserId = strangerId,
            request.reason,
            request.opensAt,
            request.dueAt,
            request.timeLimitMinutes,
            idempotencyKey = Guid.NewGuid().ToString("N")
        };
        Assert.Equal(HttpStatusCode.BadRequest,
            (await teacher.PostAsJsonAsync($"/v1/education/assignments/{original.Id}/retakes", wrongRecipient)).StatusCode);
        var created = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assignments/{original.Id}/retakes", request));
        Assert.Equal(original.Id, created.GetProperty("retakeOfAssignmentId").GetString());
        Assert.Equal(request.reason, created.GetProperty("retakeReason").GetString());
        Assert.False(created.GetProperty("studentLeaderboardEnabled").GetBoolean());
        Assert.Equal(studentId, Assert.Single(created.GetProperty("recipients").EnumerateArray()).GetProperty("studentUserId").GetString());

        var repeated = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/assignments/{original.Id}/retakes", request));
        Assert.Equal(created.GetProperty("id").GetString(), repeated.GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.PostAsJsonAsync($"/v1/education/assignments/{original.Id}/retakes", request)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict,
            (await teacher.PostAsJsonAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/retakes", request)).StatusCode);

        var studentAssignments = await DataAsync(await student.GetAsync("/v1/education/my/assignments"));
        Assert.Equal(2, studentAssignments.GetArrayLength());
        var retakeAttempt = await DataAsync(await student.PostAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/attempts", null));
        Assert.False(retakeAttempt.GetProperty("leaderboardEligible").GetBoolean());
        await DataAsync(await student.PostAsync($"/v1/education/attempts/{retakeAttempt.GetProperty("id").GetString()}/submit", null));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var persisted = await db.EducationAssignments.SingleAsync(x => x.Id == created.GetProperty("id").GetString());
            persisted.DueAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }
        await DataAsync(await teacher.PostAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/publish-results", null));
        Assert.Equal(HttpStatusCode.NotFound,
            (await student.GetAsync($"/v1/education/assignments/{created.GetProperty("id").GetString()}/leaderboard")).StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var originalAfterRetake = await db.EducationAssignments.SingleAsync(x => x.Id == original.Id);
            var unchanged = await db.EducationAssessmentAttempts.SingleAsync(x => x.Id == originalAttempt.Id);
            Assert.Equal(originalPublishedAt, originalAfterRetake.ResultsPublishedAt);
            Assert.Equal("submitted", unchanged.Status);
            Assert.Equal(0m, unchanged.Score);
            Assert.Empty(await db.EducationAssignmentLeaderboardEntries
                .Where(x => x.AssignmentId == created.GetProperty("id").GetString()).ToArrayAsync());
        }
    }

    [Fact]
    public async Task Cannot_assign_draft_assessment_or_nonmember_student()
    {
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        var classroom = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Science" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));
        var course = await DataAsync(await teacher.PostAsJsonAsync("/v1/education/courses", new { title = "Biology" }));
        var assessment = await DataAsync(await teacher.PostAsJsonAsync($"/v1/education/courses/{course.GetProperty("id").GetString()}/assessments", new { title = "Draft" }));
        var request = new
        {
            assessmentId = assessment.GetProperty("id").GetString(), title = "Assignment",
            opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddDays(1),
            timeLimitMinutes = (int?)null, idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        };
        var response = await teacher.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", request);
        Assert.True(response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 404, got {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
    }

    [Fact]
    public async Task Classroom_objective_progress_uses_recent_independent_original_evidence_and_hides_retake_and_corrected_attempts()
    {
        using var teacher = factory.CreateClient();
        using var firstStudent = factory.CreateClient();
        using var secondStudent = factory.CreateClient();
        using var staleStudent = factory.CreateClient();
        using var selectedOnlyStudent = factory.CreateClient();
        using var stranger = factory.CreateClient();
        var teacherId = await RegisterAsync(teacher);
        var firstStudentId = await RegisterAsync(firstStudent);
        var secondStudentId = await RegisterAsync(secondStudent);
        var staleStudentId = await RegisterAsync(staleStudent);
        var selectedOnlyStudentId = await RegisterAsync(selectedOnlyStudent);
        await RegisterAsync(stranger);

        string classroomId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var classroom = new EducationClassroom { OwnerUserId = teacherId, Name = "Mastery test" };
            classroomId = classroom.Id;
            db.EducationClassrooms.Add(classroom);
            db.EducationMemberships.AddRange(
                new EducationMembership { ClassroomId = classroom.Id, UserId = firstStudentId, Role = EducationMembershipRoles.Student, Status = EducationRelationshipStatuses.Active, ExpiresAt = DateTime.UtcNow.AddYears(1) },
                new EducationMembership { ClassroomId = classroom.Id, UserId = secondStudentId, Role = EducationMembershipRoles.Student, Status = EducationRelationshipStatuses.Active, ExpiresAt = DateTime.UtcNow.AddYears(1) },
                new EducationMembership { ClassroomId = classroom.Id, UserId = staleStudentId, Role = EducationMembershipRoles.Student, Status = EducationRelationshipStatuses.Active, ExpiresAt = DateTime.UtcNow.AddYears(1) },
                new EducationMembership { ClassroomId = classroom.Id, UserId = selectedOnlyStudentId, Role = EducationMembershipRoles.Student, Status = EducationRelationshipStatuses.Active, ExpiresAt = DateTime.UtcNow.AddYears(1) });

            var course = new EducationCourse { UserId = teacherId, Title = "Biology" };
            var objective = new EducationObjective { CourseId = course.Id, Title = "Cell structures" };
            db.EducationCourses.Add(course);
            db.EducationObjectives.Add(objective);
            var assessmentA = CreateAssessment(teacherId, course.Id, objective.Id, "Recall quiz A", 3, "written-response");
            var assessmentB = CreateAssessment(teacherId, course.Id, objective.Id, "Recall quiz B", 2, "written-response");
            var selectedAssessment = CreateAssessment(teacherId, course.Id, objective.Id, "Recognition quiz", 5);
            db.EducationAssessments.AddRange(assessmentA, assessmentB, selectedAssessment);

            var now = DateTime.UtcNow;
            var assignmentA = CreateAssignment(teacherId, classroom.Id, assessmentA, [firstStudentId, secondStudentId, staleStudentId], "Week one");
            var assignmentB = CreateAssignment(teacherId, classroom.Id, assessmentB, [firstStudentId, secondStudentId, staleStudentId], "Week two");
            var retakeAssignment = CreateAssignment(teacherId, classroom.Id, assessmentA, [firstStudentId], "Retake: Week one");
            retakeAssignment.RetakeOfAssignmentId = assignmentA.Id;
            retakeAssignment.RetakeReason = "Do not count a repeat assessment as new mastery evidence.";
            var selectedAssignment = CreateAssignment(teacherId, classroom.Id, selectedAssessment, [selectedOnlyStudentId], "Recognition practice");
            assignmentA.PublishResults(now);
            assignmentB.PublishResults(now);
            retakeAssignment.PublishResults(now);
            selectedAssignment.PublishResults(now);
            db.EducationAssignments.AddRange(assignmentA, assignmentB, retakeAssignment, selectedAssignment);

            AddAttempt(db, assignmentA.Recipients.Single(x => x.StudentUserId == firstStudentId), assessmentA, now.AddDays(-4), [1m, 1m, 1m]);
            AddAttempt(db, assignmentB.Recipients.Single(x => x.StudentUserId == firstStudentId), assessmentB, now.AddDays(-2), [1m, 0m]);
            AddAttempt(db, retakeAssignment.Recipients.Single(), assessmentA, now.AddDays(-3), [0m, 0m, 0m]);
            AddAttempt(db, assignmentA.Recipients.Single(x => x.StudentUserId == secondStudentId), assessmentA, now.AddDays(-4), [1m, 1m, 1m]);
            var correctedAttempt = AddAttempt(db, assignmentB.Recipients.Single(x => x.StudentUserId == secondStudentId), assessmentB, now.AddDays(-2), [1m, 0m]);
            AddAttempt(db, assignmentA.Recipients.Single(x => x.StudentUserId == staleStudentId), assessmentA, now.AddDays(-45), [1m, 1m, 1m]);
            AddAttempt(db, selectedAssignment.Recipients.Single(), selectedAssessment, now.AddDays(-1), [1m, 1m, 1m, 1m, 1m]);
            db.EducationGradeRevisions.Add(new EducationGradeRevision
            {
                AttemptId = correctedAttempt.Id, CorrectedByUserId = teacherId,
                PreviousScore = 1, NewScore = 0, MaxScore = 2, Reason = "Corrected total score"
            });
            await db.SaveChangesAsync();
        }

        var progress = await DataAsync(await teacher.GetAsync($"/v1/education/classrooms/{classroomId}/objectives/progress"));
        var students = progress.GetProperty("students").EnumerateArray().ToArray();
        Assert.Equal(4, students.Length);
        var first = students.Single(x => x.GetProperty("studentUserId").GetString() == firstStudentId);
        var firstObjective = Assert.Single(first.GetProperty("objectives").EnumerateArray());
        Assert.Equal("currently-strong", firstObjective.GetProperty("status").GetString());
        Assert.Equal(80m, firstObjective.GetProperty("percentage").GetDecimal());
        Assert.Equal(5, firstObjective.GetProperty("distinctQuestionCount").GetInt32());
        Assert.Equal(2, firstObjective.GetProperty("distinctAssessmentCount").GetInt32());
        Assert.Equal(2, firstObjective.GetProperty("distinctSubmissionDateCount").GetInt32());
        Assert.Equal(5, firstObjective.GetProperty("evidence").GetArrayLength());
        Assert.Equal(0, firstObjective.GetProperty("selectedResponsePerformance").GetProperty("distinctQuestionCount").GetInt32());
        Assert.Equal(4m, firstObjective.GetProperty("openResponsePerformance").GetProperty("score").GetDecimal());
        Assert.Equal(5m, firstObjective.GetProperty("openResponsePerformance").GetProperty("maxScore").GetDecimal());

        var second = students.Single(x => x.GetProperty("studentUserId").GetString() == secondStudentId);
        var secondObjective = Assert.Single(second.GetProperty("objectives").EnumerateArray());
        Assert.Equal("insufficient-evidence", secondObjective.GetProperty("status").GetString());
        Assert.Equal(3, secondObjective.GetProperty("distinctQuestionCount").GetInt32());
        Assert.DoesNotContain("correctOptionId", secondObjective.ToString(), StringComparison.OrdinalIgnoreCase);
        var stale = students.Single(x => x.GetProperty("studentUserId").GetString() == staleStudentId);
        var staleObjective = Assert.Single(stale.GetProperty("objectives").EnumerateArray());
        Assert.Equal("needs-revalidation", staleObjective.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, staleObjective.GetProperty("score").ValueKind);
        Assert.Empty(staleObjective.GetProperty("evidence").EnumerateArray());
        var selectedOnly = students.Single(x => x.GetProperty("studentUserId").GetString() == selectedOnlyStudentId);
        var selectedOnlyObjective = Assert.Single(selectedOnly.GetProperty("objectives").EnumerateArray());
        Assert.Equal("selected-response-only", selectedOnlyObjective.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, selectedOnlyObjective.GetProperty("score").ValueKind);
        Assert.Equal(5m, selectedOnlyObjective.GetProperty("selectedResponsePerformance").GetProperty("score").GetDecimal());
        Assert.Equal(5m, selectedOnlyObjective.GetProperty("selectedResponsePerformance").GetProperty("maxScore").GetDecimal());
        Assert.Equal(0, selectedOnlyObjective.GetProperty("openResponsePerformance").GetProperty("distinctQuestionCount").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/v1/education/classrooms/{classroomId}/objectives/progress")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await firstStudent.GetAsync($"/v1/education/classrooms/{classroomId}/objectives/progress")).StatusCode);
    }

    [Fact]
    public async Task Student_leaderboard_shows_only_own_rank_for_published_classroom_results()
    {
        using var teacher = factory.CreateClient();
        using var first = factory.CreateClient();
        using var tiedFirst = factory.CreateClient();
        using var tiedSecond = factory.CreateClient();
        using var fourth = factory.CreateClient();
        using var notSubmitted = factory.CreateClient();
        using var stranger = factory.CreateClient();
        var teacherId = await RegisterAsync(teacher);
        var firstId = await RegisterAsync(first);
        var tiedFirstId = await RegisterAsync(tiedFirst);
        var tiedSecondId = await RegisterAsync(tiedSecond);
        var fourthId = await RegisterAsync(fourth);
        var notSubmittedId = await RegisterAsync(notSubmitted);
        await RegisterAsync(stranger);

        string classroomId;
        string assignmentId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var classroom = new EducationClassroom { OwnerUserId = teacherId, Name = "Leaderboard test" };
            classroomId = classroom.Id;
            db.EducationClassrooms.Add(classroom);
            var studentIds = new[] { firstId, tiedFirstId, tiedSecondId, fourthId, notSubmittedId };
            db.EducationMemberships.AddRange(studentIds.Select(id => new EducationMembership
            {
                ClassroomId = classroom.Id, UserId = id, Role = EducationMembershipRoles.Student,
                Status = EducationRelationshipStatuses.Active, ExpiresAt = DateTime.UtcNow.AddYears(1)
            }));

            var course = new EducationCourse { UserId = teacherId, Title = "Leaderboard course" };
            var objective = new EducationObjective { CourseId = course.Id, Title = "Objective" };
            var assessment = new EducationAssessment { UserId = teacherId, CourseId = course.Id, Title = "Scores" };
            assessment.UpdateDraft("Scores", [new EducationQuestion
            {
                AssessmentId = assessment.Id, ObjectiveId = objective.Id, Prompt = "Question",
                Type = "true-false", MaxScore = 100, Position = 0, OptionsJson = "[]", AnswerKeyJson = "{}"
            }]);
            assessment.Publish(DateTime.UtcNow);
            db.EducationCourses.Add(course);
            db.EducationObjectives.Add(objective);
            db.EducationAssessments.Add(assessment);
            var assignment = CreateAssignment(teacherId, classroom.Id, assessment, studentIds, "Published quiz");
            assignment.DueAt = DateTime.UtcNow.AddMinutes(-1);
            assignment.PublishResults(DateTime.UtcNow);
            assignmentId = assignment.Id;
            db.EducationAssignments.Add(assignment);

            var now = DateTime.UtcNow;
            AddAttempt(db, assignment.Recipients.Single(x => x.StudentUserId == firstId), assessment, now.AddMinutes(-5), [90]);
            AddAttempt(db, assignment.Recipients.Single(x => x.StudentUserId == tiedFirstId), assessment, now.AddMinutes(-5), [85]);
            AddAttempt(db, assignment.Recipients.Single(x => x.StudentUserId == tiedSecondId), assessment, now.AddMinutes(-5), [85]);
            AddAttempt(db, assignment.Recipients.Single(x => x.StudentUserId == fourthId), assessment, now.AddMinutes(-5), [80]);
            await db.SaveChangesAsync();
        }

        var firstRank = await DataAsync(await first.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(1, firstRank.GetProperty("myRank").GetInt32());
        Assert.Equal(5, firstRank.GetProperty("assignedParticipantCount").GetInt32());
        Assert.Equal(4, firstRank.GetProperty("rankedParticipantCount").GetInt32());
        Assert.Equal(90m, firstRank.GetProperty("myScore").GetDecimal());
        Assert.False(firstRank.TryGetProperty("students", out _));
        var tieRank = await DataAsync(await tiedSecond.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(2, tieRank.GetProperty("myRank").GetInt32());
        var absentRank = await DataAsync(await notSubmitted.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard"));
        Assert.Equal(JsonValueKind.Null, absentRank.GetProperty("myRank").ValueKind);
        Assert.Equal(JsonValueKind.Null, absentRank.GetProperty("myScore").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard")).StatusCode);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var assignment = await db.EducationAssignments.SingleAsync(x => x.Id == assignmentId);
            assignment.UnpublishResultsForCorrection();
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.NotFound,
            (await first.GetAsync($"/v1/education/assignments/{assignmentId}/leaderboard")).StatusCode);
    }

    private static EducationAssessment CreateAssessment(string teacherId, string courseId, string objectiveId, string title, int questionCount, string type = "true-false")
    {
        var assessment = new EducationAssessment { UserId = teacherId, CourseId = courseId, Title = title };
        var questions = Enumerable.Range(0, questionCount).Select(index => new EducationQuestion
        {
            AssessmentId = assessment.Id, ObjectiveId = objectiveId, Prompt = $"Question {title}-{index}",
            Type = type, FillMode = type == "fill-blank" ? "text" : null,
            MaxScore = 1, Position = index, OptionsJson = "[]", AnswerKeyJson = "{}"
        }).ToArray();
        assessment.UpdateDraft(title, questions);
        assessment.Publish(DateTime.UtcNow);
        return assessment;
    }

    private static EducationAssignment CreateAssignment(string teacherId, string classroomId, EducationAssessment assessment,
        IReadOnlyList<string> studentIds, string title)
    {
        var assignment = new EducationAssignment
        {
            CreatorUserId = teacherId, Scope = EducationAssignmentScopes.Classroom, ClassroomId = classroomId,
            AssessmentId = assessment.Id, AssessmentVersion = assessment.Version, Title = title,
            OpensAt = DateTime.UtcNow.AddDays(-5), DueAt = DateTime.UtcNow.AddDays(1), IdempotencyKey = Guid.NewGuid().ToString("N")
        };
        foreach (var studentId in studentIds)
            assignment.Recipients.Add(new EducationAssignmentRecipient
            {
                AssignmentId = assignment.Id, StudentUserId = studentId, AssessmentId = assessment.Id,
                AssessmentVersion = assessment.Version, Title = title, OpensAt = assignment.OpensAt,
                DueAt = assignment.DueAt
            });
        return assignment;
    }

    private static EducationAssessmentAttempt AddAttempt(AppDbContext db, EducationAssignmentRecipient recipient,
        EducationAssessment assessment, DateTime submittedAt, IReadOnlyList<decimal> scores)
    {
        var attempt = EducationAssessmentAttempt.Start(recipient, submittedAt.AddMinutes(-5));
        var questions = assessment.Questions.Where(x => !x.IsDeleted).OrderBy(x => x.Position).ToArray();
        for (var index = 0; index < questions.Length; index++)
        {
            var response = new EducationAssessmentResponse { AttemptId = attempt.Id, QuestionId = questions[index].Id };
            response.RecordGrade(scores[index], scores[index] == questions[index].MaxScore);
            attempt.Responses.Add(response);
        }
        attempt.Submit(scores.Sum(), questions.Sum(x => x.MaxScore), submittedAt);
        db.EducationAssessmentAttempts.Add(attempt);
        return attempt;
    }

    private static async Task<string> CreatePublishedAssessmentAsync(HttpClient client)
    {
        var course = await DataAsync(await client.PostAsJsonAsync("/v1/education/courses", new { title = "Biology" }));
        var courseId = course.GetProperty("id").GetString()!;
        var objective = await DataAsync(await client.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Cells" }));
        var assessment = await DataAsync(await client.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title = "Cell quiz" }));
        var assessmentId = assessment.GetProperty("id").GetString()!;
        var update = await DataAsync(await client.PutAsJsonAsync($"/v1/education/assessments/{assessmentId}", new
        {
            expectedVersion = 1,
            title = "Cell quiz",
            questions = new[]
            {
                new { id = (string?)null, prompt = "Cells have a nucleus.", type = "true-false", fillMode = (string?)null,
                    maxScore = 1m, objectiveId = objective.GetProperty("id").GetString(), options = Array.Empty<object>(),
                    correctOptionId = (string?)null, correctBooleanAnswer = true, allowedTextAnswers = Array.Empty<string>(),
                    trimTextAnswers = false, ignoreCase = false, allowedNumericAnswers = Array.Empty<decimal>(), numericTolerance = 0m }
            }
        }));
        await DataAsync(await client.PostAsJsonAsync($"/v1/education/assessments/{assessmentId}/publish", new { expectedVersion = update.GetProperty("version").GetInt32() }));
        return assessmentId;
    }

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Education test",
            email = $"education-assignment-{Guid.NewGuid():N}@example.com",
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
