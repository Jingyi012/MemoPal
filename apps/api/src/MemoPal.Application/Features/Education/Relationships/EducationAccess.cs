using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed class EducationAccess(IAppDbContext db)
{
    public async Task<bool> IsActiveClassTeacherAsync(string userId, string classroomId, CancellationToken ct = default)
    {
        if (!await IsLiveClassroomAsync(classroomId, ct)) return false;
        return await db.EducationClassrooms.AnyAsync(c => c.Id == classroomId && c.OwnerUserId == userId && !c.IsDeleted, ct) ||
            await db.EducationMemberships.AnyAsync(m => m.ClassroomId == classroomId && m.UserId == userId && m.Role == EducationMembershipRoles.Teacher && m.Status == EducationRelationshipStatuses.Active && !m.IsDeleted, ct);
    }

    public async Task<bool> IsActiveClassStudentAsync(string userId, string classroomId, CancellationToken ct = default) =>
        await IsLiveClassroomAsync(classroomId, ct) &&
        await db.EducationMemberships.AnyAsync(m => m.ClassroomId == classroomId && m.UserId == userId && m.Role == EducationMembershipRoles.Student && m.Status == EducationRelationshipStatuses.Active && !m.IsDeleted, ct);

    public Task<bool> IsVerifiedGuardianAsync(string guardianUserId, string studentUserId, CancellationToken ct = default) =>
        db.EducationGuardianLinks.AnyAsync(x => x.GuardianUserId == guardianUserId && x.StudentUserId == studentUserId && x.Status == EducationRelationshipStatuses.Active && x.StudentConfirmedAt != null && x.AdminVerifiedAt != null && !x.IsDeleted, ct);

    private Task<bool> IsLiveClassroomAsync(string classroomId, CancellationToken ct) =>
        db.EducationClassrooms.AnyAsync(c => c.Id == classroomId && !c.IsDeleted, ct);
}
