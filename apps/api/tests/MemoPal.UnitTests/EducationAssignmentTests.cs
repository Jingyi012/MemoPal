using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Assignments.Commands;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Assignments.Queries;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class EducationAssignmentTests
{
    [Fact]
    public async Task ClassroomAssignmentSnapshotsPublishedAssessmentAndRecipientAndIsIdempotent()
    {
        await using var db = CreateDb();
        SeedClassroom(db);
        var handler = new CreateClassroomAssignmentHandler(db, new EducationAccess(db));
        var request = ClassroomRequest("assessment", ["student"]);

        var created = (await handler.Handle(new("teacher", "class", request), default)).Data!;
        var replayed = (await handler.Handle(new("teacher", "class", request), default)).Data!;

        Assert.Equal(created.Id, replayed.Id);
        Assert.Equal(1, await db.EducationAssignments.CountAsync());
        var recipient = Assert.Single(created.Recipients);
        Assert.Equal(created.AssessmentId, recipient.AssessmentId);
        Assert.Equal(created.AssessmentVersion, recipient.AssessmentVersion);
        Assert.Equal(created.Title, recipient.Title);
        Assert.Equal(created.OpensAt, recipient.OpensAt);
        Assert.Equal(created.DueAt, recipient.DueAt);
        Assert.Equal("student", recipient.StudentUserId);
        Assert.Equal(1, recipient.TimeLimitMinutes);
    }

    [Fact]
    public async Task ClassroomAssignmentRejectsNonTeacherNonStudentDraftAndDuplicateTargets()
    {
        await using var db = CreateDb();
        SeedClassroom(db);
        var handler = new CreateClassroomAssignmentHandler(db, new EducationAccess(db));
        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(new("stranger", "class", ClassroomRequest("assessment", ["student"])), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("teacher", "class", ClassroomRequest("assessment", ["stranger"])), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("teacher", "class", ClassroomRequest("assessment", ["student", "student"])), default));
        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(new("teacher", "class", ClassroomRequest("draft", ["student"])), default));
        Assert.Empty(await db.EducationAssignments.ToListAsync());
    }

    [Fact]
    public async Task IdempotencyKeyCannotBeReusedForDifferentTaskAndDatesAreValidated()
    {
        await using var db = CreateDb();
        SeedClassroom(db);
        var handler = new CreateClassroomAssignmentHandler(db, new EducationAccess(db));
        var request = ClassroomRequest("assessment", ["student"]);
        await handler.Handle(new("teacher", "class", request), default);
        var altered = request with { Title = "Changed title" };
        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(new("teacher", "class", altered), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("teacher", "class", request with { DueAt = request.OpensAt }), default));
        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(new("teacher", "class", request with { TimeLimitMinutes = 0 }), default));
    }

    [Fact]
    public async Task FamilyAssignmentRequiresVerifiedGuardianAndStudentQueryDoesNotExposeAnswerFields()
    {
        await using var db = CreateDb();
        db.EducationAssessments.Add(PublishedAssessment("assessment", "guardian"));
        db.EducationGuardianLinks.Add(new EducationGuardianLink
        {
            Id = "link", GuardianUserId = "guardian", StudentUserId = "child",
            Status = EducationRelationshipStatuses.Active, StudentConfirmedAt = DateTime.UtcNow,
            AdminVerifiedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var handler = new CreateFamilyAssignmentHandler(db, new EducationAccess(db));
        var request = new CreateFamilyAssignmentRequest("assessment", "Family work", DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddDays(2), null, "family-key", ["child"]);
        var created = (await handler.Handle(new("guardian", request), default)).Data!;
        var studentView = Assert.Single((await new GetMyEducationAssignmentsHandler(db).Handle(new("child"), default)).Data!);
        var strangerView = await new GetMyEducationAssignmentsHandler(db).Handle(new("other"), default);

        Assert.Equal(created.Id, studentView.Id);
        Assert.Empty(strangerView.Data!);
        Assert.DoesNotContain(typeof(MyEducationAssignmentDto).GetProperties(), property => property.Name.Contains("Answer", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(typeof(EducationAssignmentRecipientDto).GetProperties(), property => property.Name.Contains("Answer", StringComparison.OrdinalIgnoreCase));
        db.EducationGuardianLinks.Single().AdminVerifiedAt = null;
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(new("guardian", request with { IdempotencyKey = "new-key" }), default));
    }

    [Fact]
    public void AssignmentPersistenceHasUniqueRequestAndRecipientIndexes()
    {
        using var db = CreateDb();
        AssertUniqueIndex<EducationAssignment>(db, nameof(EducationAssignment.CreatorUserId), nameof(EducationAssignment.IdempotencyKey));
        AssertUniqueIndex<EducationAssignmentRecipient>(db, nameof(EducationAssignmentRecipient.AssignmentId), nameof(EducationAssignmentRecipient.StudentUserId));
    }

    private static void AssertUniqueIndex<TEntity>(AppDbContext db, params string[] properties) where TEntity : class
    {
        var index = db.Model.FindEntityType(typeof(TEntity))!.GetIndexes()
            .Single(x => x.Properties.Select(p => p.Name).SequenceEqual(properties));
        Assert.True(index.IsUnique);
    }

    private static CreateClassroomAssignmentRequest ClassroomRequest(string assessmentId, IReadOnlyList<string> studentIds) =>
        new(assessmentId, "Unit work", DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddDays(3), 1, "class-key", studentIds);

    private static void SeedClassroom(AppDbContext db)
    {
        db.EducationClassrooms.Add(new EducationClassroom { Id = "class", OwnerUserId = "teacher", Name = "Class" });
        db.EducationMemberships.Add(new EducationMembership { Id = "membership", ClassroomId = "class", UserId = "student", Role = "student", Status = "active" });
        db.EducationMemberships.Add(new EducationMembership { Id = "teacher-membership", ClassroomId = "class", UserId = "teacher", Role = "teacher", Status = "active" });
        db.EducationAssessments.Add(PublishedAssessment("assessment", "teacher"));
        db.EducationAssessments.Add(new EducationAssessment { Id = "draft", UserId = "teacher" });
        db.SaveChanges();
    }

    private static EducationAssessment PublishedAssessment(string id, string owner)
    {
        var assessment = new EducationAssessment { Id = id, UserId = owner, CourseId = "course", Title = "Assessment" };
        assessment.Questions.Add(new EducationQuestion { AssessmentId = id, Prompt = "Question", Type = "true-false", MaxScore = 1 });
        assessment.Publish(DateTime.UtcNow);
        return assessment;
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
}
