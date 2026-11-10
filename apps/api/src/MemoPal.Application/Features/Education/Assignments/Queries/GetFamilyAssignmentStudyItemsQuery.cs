using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record FamilyAssignmentStudyObjectiveDto(string Id, string Title,
    IReadOnlyList<EducationLearnerStudyItemDto> StudyItems);
public sealed record GetFamilyAssignmentStudyItemsQuery(string UserId, string AssignmentId)
    : IRequest<ApiResponse<IReadOnlyList<FamilyAssignmentStudyObjectiveDto>>>;

public sealed class GetFamilyAssignmentStudyItemsHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetFamilyAssignmentStudyItemsQuery, ApiResponse<IReadOnlyList<FamilyAssignmentStudyObjectiveDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<FamilyAssignmentStudyObjectiveDto>>> Handle(
        GetFamilyAssignmentStudyItemsQuery query, CancellationToken ct)
    {
        var recipient = await db.EducationAssignmentRecipients.AsNoTracking().Include(x => x.Assignment)
            .FirstOrDefaultAsync(x => x.AssignmentId == query.AssignmentId && x.StudentUserId == query.UserId &&
                !x.IsDeleted && x.Assignment != null && !x.Assignment.IsDeleted &&
                x.Assignment.Scope == EducationAssignmentScopes.Family, ct)
            ?? throw new NotFoundAppException("Assigned study content not found.");
        if (!await access.IsVerifiedGuardianAsync(recipient.Assignment!.CreatorUserId, query.UserId, ct))
            throw new NotFoundAppException("Assigned study content not found.");
        var now = DateTime.UtcNow;
        if (now < recipient.OpensAt || now >= recipient.DueAt)
            throw new ConflictAppException("This assignment is not open for study.");
        // Preparation must not become an answer reference inside a timed attempt.
        if (await db.EducationAssessmentAttempts.AsNoTracking().AnyAsync(x => x.RecipientId == recipient.Id && !x.IsDeleted, ct))
            throw new ConflictAppException("Preparation is available before starting this assignment.");
        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, recipient, ct);
        if (!await db.EducationCourses.AsNoTracking().AnyAsync(x => x.Id == assessment.CourseId && !x.IsDeleted && !x.IsModerationHidden, ct))
            throw new NotFoundAppException("Assigned study content not found.");
        var objectiveIds = assessment.Questions.Where(x => !x.IsDeleted).OrderBy(x => x.Position)
            .Select(x => x.ObjectiveId).Distinct().ToArray();
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(x => objectiveIds.Contains(x.Id) && x.CourseId == assessment.CourseId && !x.IsDeleted).ToListAsync(ct);
        var visibleIds = objectives.Select(x => x.Id).ToArray();
        var items = await db.EducationObjectiveStudyItems.AsNoTracking()
            .Where(x => visibleIds.Contains(x.ObjectiveId) && !x.IsDeleted && x.Status == EducationStudyItemStatus.Published)
            .OrderBy(x => x.Position).ThenBy(x => x.Id).ToListAsync(ct);
        var result = objectives.OrderBy(x => Array.IndexOf(objectiveIds, x.Id)).Select(objective =>
            new FamilyAssignmentStudyObjectiveDto(objective.Id, objective.Title,
                items.Where(x => x.ObjectiveId == objective.Id).Select(item => new EducationLearnerStudyItemDto(
                    item.Id, item.Position, item.Kind.ToString(), item.Primary, item.Secondary, item.Phonetic,
                    item.Extra, item.LanguageCode, item.ContentVersion, objective.ReviewStatus.ToString(),
                    objective.ContentOrigin.ToString(), EducationStudyIllustrations.FromMediaReference(item.MediaRef))).ToArray()))
            .Where(x => x.StudyItems.Count > 0).ToArray();
        return ApiResponse<IReadOnlyList<FamilyAssignmentStudyObjectiveDto>>.Ok(result);
    }
}
