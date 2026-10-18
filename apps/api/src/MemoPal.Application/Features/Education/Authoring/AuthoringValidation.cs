using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

internal static class AuthoringValidation
{
    public static string Title(string? value, string kind)
    {
        var title = value?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length > 200)
            throw new ValidationAppException($"{kind} title is required and must be 200 characters or fewer.");
        return title;
    }

    public static async Task<EducationCourse> OwnedCourse(IAppDbContext db, string userId, string id, CancellationToken ct) =>
        await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && !x.IsDeleted, ct)
        ?? throw new NotFoundAppException("Course not found.");

    public static async Task<EducationAssessment> OwnedAssessment(IAppDbContext db, string userId, string id, CancellationToken ct) =>
        await db.EducationAssessments.Include(x => x.Questions)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && !x.IsDeleted && x.Course != null && !x.Course.IsDeleted, ct)
        ?? throw new NotFoundAppException("Assessment not found.");

    public static async Task<string?> RecommendableMemorySetId(IAppDbContext db, string? requestedId, CancellationToken ct)
    {
        var id = string.IsNullOrWhiteSpace(requestedId) ? null : requestedId.Trim();
        if (id is null) return null;
        var isDiscoverable = await db.MemorySets.AsNoTracking()
            .Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .AnyAsync(memorySet => memorySet.Id == id, ct);
        if (!isDiscoverable)
            throw new ValidationAppException("Only currently public and visible memory sets can be recommended in a course.");
        return id;
    }

    public static void CheckVersion(EducationAssessment assessment, int expectedVersion)
    {
        if (expectedVersion != assessment.Version)
            throw new ConflictAppException($"This assessment changed. Reload version {assessment.Version} before saving.");
    }
}
