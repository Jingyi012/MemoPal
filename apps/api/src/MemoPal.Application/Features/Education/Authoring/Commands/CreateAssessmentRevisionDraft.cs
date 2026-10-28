using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record CreateAssessmentRevisionDraftCommand(string UserId, string AssessmentId, int ExpectedVersion,
    bool IsAdmin = false) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class CreateAssessmentRevisionDraftHandler(IAppDbContext db)
    : IRequestHandler<CreateAssessmentRevisionDraftCommand, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(CreateAssessmentRevisionDraftCommand command, CancellationToken ct)
    {
        var source = await AuthoringValidation.OwnedAssessment(db, command.UserId, command.AssessmentId, ct, command.IsAdmin);
        AuthoringValidation.CheckVersion(source, command.ExpectedVersion);
        if (source.Status != EducationAssessmentStatuses.Published)
            throw new ConflictAppException("Only a published assessment can be copied into a revision draft.");

        var title = $"Revision of: {source.Title}";
        if (title.Length > 200) title = title[..200];
        var revision = new EducationAssessment
        {
            Id = Guid.NewGuid().ToString("D"),
            UserId = source.UserId,
            CourseId = source.CourseId,
            Title = title
        };
        revision.Questions = source.Questions.Where(question => !question.IsDeleted)
            .OrderBy(question => question.Position)
            .Select((question, position) => EducationAuthoringMapper.ApplyRequest(
                EducationAuthoringMapper.ToRequest(question), revision.Id, position))
            .ToArray();
        if (revision.Questions.Count == 0)
            throw new ConflictAppException("The published assessment has no questions to copy.");
        var objectiveIds = revision.Questions.Select(question => question.ObjectiveId).Distinct().ToArray();
        var activeObjectiveCount = await db.EducationObjectives.CountAsync(objective =>
            objectiveIds.Contains(objective.Id) && objective.CourseId == source.CourseId && !objective.IsDeleted, ct);
        if (activeObjectiveCount != objectiveIds.Length)
            throw new ValidationAppException("This assessment includes a removed learning objective. Restore or replace it before creating a revision.");

        db.EducationAssessments.Add(revision);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(revision));
    }
}
