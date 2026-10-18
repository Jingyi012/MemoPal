using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class EducationRelationshipTests
{
    [Fact]
    public async Task ClassroomCreationAndInvitationAreOwnerScopedAndRejectSelfPromotion()
    {
        await using var db = CreateDb();
        db.Users.AddRange(new User { Id = "owner" }, new User { Id = "invitee" });
        await db.SaveChangesAsync();
        var created = await new CreateClassroomHandler(db).Handle(new("owner", new("Room")), default);
        var classroomId = Assert.IsType<EducationClassroomDto>(created.Data).Id;

        await Assert.ThrowsAsync<NotFoundAppException>(() => new InviteClassroomMemberHandler(db)
            .Handle(new("other", classroomId, new("invitee", "teacher")), default));
        await Assert.ThrowsAsync<MemoPal.Application.Common.Exceptions.ValidationAppException>(() => new InviteClassroomMemberHandler(db)
            .Handle(new("owner", classroomId, new("owner", "teacher")), default));
        var invitation = await new InviteClassroomMemberHandler(db).Handle(new("owner", classroomId, new("invitee", "teacher")), default);

        Assert.Equal("pending", invitation.Data!.Status);
        Assert.Equal(DateTime.UtcNow.Date.AddDays(7), invitation.Data.ExpiresAt.Date);
    }

    [Fact]
    public async Task InvitationAcceptanceIsInviteeScopedExpiresOnlyBeforeAcceptanceAndIsIdempotent()
    {
        await using var db = CreateDb();
        var classroom = new EducationClassroom { Id = "class", OwnerUserId = "owner", Name = "Room" };
        var membership = new EducationMembership { Id = "membership", ClassroomId = classroom.Id, UserId = "student", Role = "student", Status = "pending", ExpiresAt = DateTime.UtcNow.AddDays(-1) };
        db.AddRange(classroom, membership); await db.SaveChangesAsync();
        var handler = new AcceptClassroomInvitationHandler(db);

        await Assert.ThrowsAsync<NotFoundAppException>(() => handler.Handle(new("intruder", membership.Id), default));
        await Assert.ThrowsAsync<ConflictAppException>(() => handler.Handle(new("student", membership.Id), default));
        membership.ExpiresAt = DateTime.UtcNow.AddDays(-1);
        membership.Status = EducationRelationshipStatuses.Active;
        membership.AcceptedAt = DateTime.UtcNow.AddDays(-2);
        await db.SaveChangesAsync();

        var first = await handler.Handle(new("student", membership.Id), default);
        var second = await handler.Handle(new("student", membership.Id), default);
        Assert.Equal("active", first.Data!.Status);
        Assert.Equal(first.Data.AcceptedAt, second.Data!.AcceptedAt);
    }

    [Fact]
    public async Task ActiveMembershipRemainsValidAfterInvitationExpiryButDeletedClassBlocksAccess()
    {
        await using var db = CreateDb();
        db.AddRange(new EducationClassroom { Id = "class", OwnerUserId = "owner", Name = "Room" },
            new EducationMembership { Id = "m", ClassroomId = "class", UserId = "student", Role = "student", Status = "active", ExpiresAt = DateTime.UtcNow.AddDays(-10) });
        await db.SaveChangesAsync();
        var access = new EducationAccess(db);

        Assert.True(await access.IsActiveClassStudentAsync("student", "class"));
        var classroom = await db.EducationClassrooms.SingleAsync(); classroom.IsDeleted = true; await db.SaveChangesAsync();
        Assert.False(await access.IsActiveClassStudentAsync("student", "class"));
    }

    [Fact]
    public async Task GuardianAccessRequiresBothConfirmationAndAdminVerificationAndEitherPartyCanRevoke()
    {
        await using var db = CreateDb();
        db.Users.AddRange(new User { Id = "guardian" }, new User { Id = "student" }); await db.SaveChangesAsync();
        var created = await new CreateGuardianLinkHandler(db).Handle(new("guardian", new("student")), default);
        var linkId = created.Data!.Id;
        var access = new EducationAccess(db);
        Assert.False(await access.IsVerifiedGuardianAsync("guardian", "student"));

        await new VerifyGuardianLinkHandler(db).Handle(new("admin", linkId), default);
        Assert.False(await access.IsVerifiedGuardianAsync("guardian", "student"));
        await new ConfirmGuardianLinkHandler(db).Handle(new("student", linkId), default);
        Assert.True(await access.IsVerifiedGuardianAsync("guardian", "student"));
        await new RevokeGuardianLinkHandler(db).Handle(new("student", linkId), default);
        Assert.False(await access.IsVerifiedGuardianAsync("guardian", "student"));
    }

    [Fact]
    public void RelationshipIndexesEnforceUniqueClassMembershipAndGuardianPair()
    {
        using var db = CreateDb();
        var membershipIndex = db.Model.FindEntityType(typeof(EducationMembership))!.GetIndexes()
            .Single(x => x.Properties.Select(p => p.Name).SequenceEqual([nameof(EducationMembership.ClassroomId), nameof(EducationMembership.UserId)]));
        var guardianIndex = db.Model.FindEntityType(typeof(EducationGuardianLink))!.GetIndexes()
            .Single(x => x.Properties.Select(p => p.Name).SequenceEqual([nameof(EducationGuardianLink.GuardianUserId), nameof(EducationGuardianLink.StudentUserId)]));
        Assert.True(membershipIndex.IsUnique);
        Assert.True(guardianIndex.IsUnique);
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
}
