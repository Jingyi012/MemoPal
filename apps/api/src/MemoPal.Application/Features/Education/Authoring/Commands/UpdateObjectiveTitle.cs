using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record UpdateObjectiveTitleCommand(string UserId, string CourseId, string ObjectiveId,
    UpdateObjectiveTitleRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationObjectiveDto>>;

public sealed class UpdateObjectiveTitleHandler(IAppDbContext db)
    : IRequestHandler<UpdateObjectiveTitleCommand, ApiResponse<EducationObjectiveDto>>
{
    public async Task<ApiResponse<EducationObjectiveDto>> Handle(UpdateObjectiveTitleCommand command, CancellationToken ct)
    {
        var objective = await UpdateObjectiveStudyMetadataHandler.OwnedObjective(db, command.UserId, command.CourseId, command.ObjectiveId, ct, command.IsAdmin);
        objective.Title = EducationStudyItemValidation.Clean(command.Request.Title, 200, "Objective title", true);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationObjectiveDto>.Ok(UpdateObjectiveStudyMetadataHandler.ToObjectiveDto(objective));
    }
}
