using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record GetObjectivesQuery(string UserId, string CourseId) : IRequest<ApiResponse<IReadOnlyList<EducationObjectiveDto>>>;

public sealed class GetObjectivesQueryHandler(IAppDbContext db) : IRequestHandler<GetObjectivesQuery, ApiResponse<IReadOnlyList<EducationObjectiveDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationObjectiveDto>>> Handle(GetObjectivesQuery query, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, query.UserId, query.CourseId, ct);
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(objective => objective.CourseId == query.CourseId && !objective.IsDeleted)
            .OrderBy(objective => objective.Title)
            .Select(objective => new EducationObjectiveDto(objective.Id, objective.CourseId, objective.Title, objective.CreatedAt, objective.RecommendedMemorySetId))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationObjectiveDto>>.Ok(objectives);
    }
}
