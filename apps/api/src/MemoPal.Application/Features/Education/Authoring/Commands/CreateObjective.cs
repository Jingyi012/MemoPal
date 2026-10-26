using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Application.Features.Education.StudyItems;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record CreateObjectiveCommand(string UserId, string CourseId, CreateObjectiveRequest Request) : IRequest<ApiResponse<EducationObjectiveDto>>;

public sealed class CreateObjectiveCommandHandler(IAppDbContext db) : IRequestHandler<CreateObjectiveCommand, ApiResponse<EducationObjectiveDto>>
{
    public async Task<ApiResponse<EducationObjectiveDto>> Handle(CreateObjectiveCommand command, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct);
        var memorySetId = await AuthoringValidation.RecommendableMemorySetId(db, command.Request.RecommendedMemorySetId, ct);
        var objective = new EducationObjective
        {
            CourseId = command.CourseId,
            Title = EducationStudyItemValidation.Clean(command.Request.Title, 200, "Objective title", true),
            RecommendedMemorySetId = memorySetId
        };
        db.EducationObjectives.Add(objective);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveDto>.Ok(new(objective.Id, objective.CourseId, objective.Title, objective.CreatedAt, objective.RecommendedMemorySetId));
    }
}
