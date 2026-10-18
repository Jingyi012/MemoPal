using System.Text.Json;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Attempts.Commands;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.Attempts.Queries;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace MemoPal.UnitTests;

public sealed class EducationAssessmentAttemptTests
{
    [Fact]
    public async Task StartIsIdempotentUsesRecipientSnapshotAndExposesNoAnswerKey()
    {
        var dbName = Guid.NewGuid().ToString("N");
        await using var db = CreateDb(dbName);
        var (recipient, assessment) = Seed(db, timeLimitMinutes: 30, dueInMinutes: 10);
        var handler = new StartEducationAssessmentAttemptHandler(db);

        var first = (await handler.Handle(new("student", "assignment"), default)).Data!;
        var second = (await handler.Handle(new("student", "assignment"), default)).Data!;

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(EducationAssessmentAttemptStatuses.InProgress, first.Status);
        Assert.Equal(recipient.AssessmentVersion, assessment.Version);
        Assert.True(first.ExpiresAt <= recipient.DueAt);
        Assert.False(first.ResultPublished);
        Assert.Null(first.Score);
        Assert.Null(first.MaxScore);
        var json = JsonSerializer.Serialize(first);
        Assert.DoesNotContain("AnswerKey", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("correctOptionId", json, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(JsonValueKind.Null, JsonDocument.Parse(json).RootElement.GetProperty("Score").ValueKind);
        Assert.Equal(1, await db.Set<EducationAssessmentAttempt>().CountAsync());
    }

    [Fact]
    public async Task AutosaveAndSubmitGradeAllSupportedInputModesOnceAndHideResultsUntilPublished()
    {
        await using var db = CreateDb(Guid.NewGuid().ToString("N"));
        Seed(db);
        var start = (await new StartEducationAssessmentAttemptHandler(db).Handle(new("student", "assignment"), default)).Data!;
        var questions = start.Questions.ToDictionary(x => x.Type == ObjectiveQuestionTypeCodes.FillBlank ? x.FillMode! : x.Type);
        var save = new SaveEducationAssessmentResponseHandler(db);
        var expected = start.Version;
        await save.Handle(new("student", start.Id, Save(questions[ObjectiveQuestionTypeCodes.SingleChoice].Id, expected,
            new("single-choice", OptionId: "correct"))), default);
        expected++;
        await save.Handle(new("student", start.Id, Save(questions[ObjectiveQuestionTypeCodes.TrueFalse].Id, expected,
            new("true-false", BooleanValue: true))), default);
        expected++;
        await save.Handle(new("student", start.Id, Save(questions[FillBlankModeCodes.Text].Id, expected,
            new("text", TextValue: "Kuala Lumpur"))), default);
        expected++;
        await save.Handle(new("student", start.Id, Save(questions[FillBlankModeCodes.Number].Id, expected,
            new("number", NumericValue: "42.5"))), default);

        var submitHandler = new SubmitEducationAssessmentAttemptHandler(db);
        var submitted = (await submitHandler.Handle(new("student", start.Id), default)).Data!;
        var versionAfterSubmit = (await db.Set<EducationAssessmentAttempt>().SingleAsync()).Version;
        var graded = await db.Set<EducationAssessmentResponse>().Where(x => x.AttemptId == start.Id).ToListAsync();
        var repeated = (await submitHandler.Handle(new("student", start.Id), default)).Data!;

        Assert.Equal(EducationAssessmentAttemptStatuses.Submitted, submitted.Status);
        Assert.False(submitted.ResultPublished);
        Assert.Null(submitted.Score);
        Assert.Null(submitted.MaxScore);
        Assert.Equal(submitted.SubmittedAt, repeated.SubmittedAt);
        Assert.Equal(versionAfterSubmit, (await db.Set<EducationAssessmentAttempt>().SingleAsync()).Version);
        Assert.Equal(4, graded.Count);
        Assert.All(graded, response => Assert.Equal(1m, response.Score));
        Assert.All(graded, response => Assert.True(response.IsCorrect));
        await Assert.ThrowsAsync<ConflictAppException>(() => save.Handle(new("student", start.Id,
            Save(questions[ObjectiveQuestionTypeCodes.TrueFalse].Id, versionAfterSubmit, new("true-false", BooleanValue: false))), default));
    }

    [Fact]
    public async Task MissingAnswerGetsZeroAndExplicitClearRemovesSavedValue()
    {
        await using var db = CreateDb(Guid.NewGuid().ToString("N"));
        Seed(db);
        var start = (await new StartEducationAssessmentAttemptHandler(db).Handle(new("student", "assignment"), default)).Data!;
        var question = start.Questions[0];
        var handler = new SaveEducationAssessmentResponseHandler(db);
        await handler.Handle(new("student", start.Id, Save(question.Id, start.Version, new("single-choice", OptionId: "correct"))), default);
        await handler.Handle(new("student", start.Id, new(question.Id, start.Version + 1, true, null)), default);
        var saved = await db.Set<EducationAssessmentResponse>().SingleAsync(x => x.QuestionId == question.Id);
        Assert.Null(saved.AnswerJson);

        var result = (await new SubmitEducationAssessmentAttemptHandler(db).Handle(new("student", start.Id), default)).Data!;
        Assert.False(result.ResultPublished);
        Assert.Equal(0m, (await db.Set<EducationAssessmentResponse>().SingleAsync(x => x.QuestionId == question.Id)).Score);
        Assert.Equal(0m, (await db.Set<EducationAssessmentAttempt>().SingleAsync()).Score);
    }

    [Fact]
    public async Task StudentOwnershipQuestionMembershipAnswerShapeAndVersionAreEnforced()
    {
        await using var db = CreateDb(Guid.NewGuid().ToString("N"));
        Seed(db);
        var start = (await new StartEducationAssessmentAttemptHandler(db).Handle(new("student", "assignment"), default)).Data!;
        var get = new GetEducationAssessmentAttemptHandler(db);
        await Assert.ThrowsAsync<NotFoundAppException>(() => get.Handle(new("other-student", start.Id), default));
        var save = new SaveEducationAssessmentResponseHandler(db);
        var questionId = start.Questions[0].Id;
        await Assert.ThrowsAsync<ValidationAppException>(() => save.Handle(new("student", start.Id, Save("outside-question", start.Version,
            new("single-choice", OptionId: "correct"))), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => save.Handle(new("student", start.Id, Save(questionId, start.Version,
            new("true-false", BooleanValue: true))), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => save.Handle(new("student", start.Id,
            new(questionId, start.Version, false, new("single-choice", OptionId: "wrong", TextValue: "extra"))), default));
        await save.Handle(new("student", start.Id, Save(questionId, start.Version, new("single-choice", OptionId: "correct"))), default);
        await Assert.ThrowsAsync<ConflictAppException>(() => save.Handle(new("student", start.Id,
            Save(questionId, start.Version, new("single-choice", OptionId: "correct"))), default));
    }

    [Fact]
    public async Task StartWindowAndAttemptExpiryAreEnforced()
    {
        await using var db = CreateDb(Guid.NewGuid().ToString("N"));
        Seed(db, opensInMinutes: 5);
        await Assert.ThrowsAsync<ConflictAppException>(() => new StartEducationAssessmentAttemptHandler(db)
            .Handle(new("student", "assignment"), default));

        var recipient = await db.EducationAssignmentRecipients.SingleAsync();
        recipient.OpensAt = DateTime.UtcNow.AddMinutes(-1);
        var expired = EducationAssessmentAttempt.Start(recipient, DateTime.UtcNow.AddMinutes(-200));
        expired.SaveResponse("question-choice", "{\"Type\":\"single-choice\",\"OptionId\":\"correct\"}",
            expired.Version, DateTime.UtcNow.AddMinutes(-150));
        db.Set<EducationAssessmentAttempt>().Add(expired);
        await db.SaveChangesAsync();
        var save = new SaveEducationAssessmentResponseHandler(db);
        await Assert.ThrowsAsync<ConflictAppException>(() => save.Handle(new("student", expired.Id,
            Save("question-choice", expired.Version, new("single-choice", OptionId: "correct"))), default));
        var submitHandler = new SubmitEducationAssessmentAttemptHandler(db);
        var submitted = (await submitHandler.Handle(new("student", expired.Id), default)).Data!;
        var retried = (await submitHandler.Handle(new("student", expired.Id), default)).Data!;
        Assert.Equal(EducationAssessmentAttemptStatuses.Submitted, submitted.Status);
        Assert.Equal(expired.ExpiresAt, submitted.SubmittedAt);
        Assert.Equal(submitted.SubmittedAt, retried.SubmittedAt);
        Assert.Equal(1m, (await db.Set<EducationAssessmentResponse>().SingleAsync(x => x.QuestionId == "question-choice")).Score);
    }

    [Fact]
    public async Task ConcurrentStaleWriteIsRejectedByOptimisticConcurrencyToken()
    {
        var dbName = Guid.NewGuid().ToString("N");
        await using (var seedDb = CreateDb(dbName)) Seed(seedDb);
        await using var firstDb = CreateDb(dbName);
        var started = (await new StartEducationAssessmentAttemptHandler(firstDb).Handle(new("student", "assignment"), default)).Data!;
        await using var staleDb = CreateDb(dbName);
        var firstAttempt = await firstDb.Set<EducationAssessmentAttempt>().Include(x => x.Responses).Include(x => x.Recipient).ThenInclude(x => x!.Assignment).SingleAsync();
        var staleAttempt = await staleDb.Set<EducationAssessmentAttempt>().Include(x => x.Responses).Include(x => x.Recipient).ThenInclude(x => x!.Assignment).SingleAsync();
        var questionId = started.Questions[0].Id;
        firstAttempt.SaveResponse(questionId, "{\"Type\":\"single-choice\",\"OptionId\":\"correct\"}", 1, DateTime.UtcNow);
        await firstDb.SaveChangesAsync();
        staleAttempt.SaveResponse(questionId, "{\"Type\":\"single-choice\",\"OptionId\":\"wrong\"}", 1, DateTime.UtcNow);
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => staleDb.SaveChangesAsync());
    }

    private static SaveEducationAttemptResponseRequest Save(string questionId, int version, EducationAttemptAnswerInputDto answer) =>
        new(questionId, version, false, answer);

    private static (EducationAssignmentRecipient Recipient, EducationAssessment Assessment) Seed(
        TestEducationAttemptDbContext db, int timeLimitMinutes = 60, int dueInMinutes = 120, int opensInMinutes = -1)
    {
        var now = DateTime.UtcNow;
        var assessment = new EducationAssessment { Id = "assessment", CourseId = "course", UserId = "teacher", Title = "Quiz" };
        var questions = new[]
        {
            Question("question-choice", ObjectiveQuestionTypeCodes.SingleChoice, options: "[{\"Id\":\"correct\",\"Label\":\"Correct\"},{\"Id\":\"wrong\",\"Label\":\"Wrong\"}]",
                key: "{\"CorrectOptionId\":\"correct\",\"CorrectBooleanAnswer\":null,\"AllowedTextAnswers\":[],\"TrimTextAnswers\":false,\"IgnoreCase\":false,\"AllowedNumericAnswers\":[],\"NumericTolerance\":0}"),
            Question("question-boolean", ObjectiveQuestionTypeCodes.TrueFalse,
                key: "{\"CorrectOptionId\":null,\"CorrectBooleanAnswer\":true,\"AllowedTextAnswers\":[],\"TrimTextAnswers\":false,\"IgnoreCase\":false,\"AllowedNumericAnswers\":[],\"NumericTolerance\":0}"),
            Question("question-text", ObjectiveQuestionTypeCodes.FillBlank, FillBlankModeCodes.Text,
                key: "{\"CorrectOptionId\":null,\"CorrectBooleanAnswer\":null,\"AllowedTextAnswers\":[\"Kuala Lumpur\"],\"TrimTextAnswers\":true,\"IgnoreCase\":true,\"AllowedNumericAnswers\":[],\"NumericTolerance\":0}"),
            Question("question-number", ObjectiveQuestionTypeCodes.FillBlank, FillBlankModeCodes.Number,
                key: "{\"CorrectOptionId\":null,\"CorrectBooleanAnswer\":null,\"AllowedTextAnswers\":[],\"TrimTextAnswers\":false,\"IgnoreCase\":false,\"AllowedNumericAnswers\":[42.5],\"NumericTolerance\":0}")
        };
        foreach (var question in questions) assessment.Questions.Add(question);
        assessment.Publish(now);
        var assignment = new EducationAssignment { Id = "assignment", CreatorUserId = "teacher", AssessmentId = assessment.Id, AssessmentVersion = assessment.Version, Title = "Work", OpensAt = now.AddMinutes(opensInMinutes), DueAt = now.AddMinutes(dueInMinutes), TimeLimitMinutes = timeLimitMinutes };
        var recipient = new EducationAssignmentRecipient { Id = "recipient", AssignmentId = assignment.Id, StudentUserId = "student", AssessmentId = assessment.Id, AssessmentVersion = assessment.Version, Title = assignment.Title, OpensAt = assignment.OpensAt, DueAt = assignment.DueAt, TimeLimitMinutes = timeLimitMinutes, Assignment = assignment };
        assignment.Recipients.Add(recipient);
        db.EducationAssessments.Add(assessment);
        db.EducationAssignments.Add(assignment);
        db.SaveChanges();
        return (recipient, assessment);
    }

    private static EducationQuestion Question(string id, string type, string? fillMode = null, string options = "[]", string key = "{}") =>
        new() { Id = id, AssessmentId = "assessment", ObjectiveId = "objective", Prompt = $"Prompt {id}", Type = type, FillMode = fillMode, MaxScore = 1, Position = id == "question-choice" ? 0 : id == "question-boolean" ? 1 : id == "question-text" ? 2 : 3, OptionsJson = options, AnswerKeyJson = key };

    private static TestEducationAttemptDbContext CreateDb(string name) => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(name).Options);

    private sealed class TestEducationAttemptDbContext(DbContextOptions<AppDbContext> options)
        : AppDbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            var attempts = new EducationAttemptConfiguration();
            modelBuilder.ApplyConfiguration<EducationAssessmentAttempt>(attempts);
            modelBuilder.ApplyConfiguration<EducationAssessmentResponse>(attempts);
        }
    }
}
