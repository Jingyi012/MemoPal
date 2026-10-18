using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;

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
            Title = AuthoringValidation.Title(command.Request.Title, "Objective"),
            RecommendedMemorySetId = memorySetId
        };
        db.EducationObjectives.Add(objective);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveDto>.Ok(new(objective.Id, objective.CourseId, objective.Title, objective.CreatedAt, objective.RecommendedMemorySetId));
    }
}
