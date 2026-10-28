using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record SetEducationObjectiveMemoryRecommendationCommand(
    string UserId, string CourseId, string ObjectiveId, string? RecommendedMemorySetId, bool IsAdmin = false)
    : IRequest<ApiResponse<EducationObjectiveDto>>;

public sealed class SetEducationObjectiveMemoryRecommendationHandler(IAppDbContext db)
    : IRequestHandler<SetEducationObjectiveMemoryRecommendationCommand, ApiResponse<EducationObjectiveDto>>
{
    public async Task<ApiResponse<EducationObjectiveDto>> Handle(
        SetEducationObjectiveMemoryRecommendationCommand command, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct, command.IsAdmin);
        var objective = await db.EducationObjectives.FirstOrDefaultAsync(item =>
            item.Id == command.ObjectiveId && item.CourseId == command.CourseId && !item.IsDeleted, ct)
            ?? throw new NotFoundAppException("Learning objective not found.");

        objective.RecommendedMemorySetId = await AuthoringValidation.RecommendableMemorySetId(
            db, command.RecommendedMemorySetId, ct);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveDto>.Ok(new(
            objective.Id, objective.CourseId, objective.Title, objective.CreatedAt, objective.RecommendedMemorySetId));
    }
}
