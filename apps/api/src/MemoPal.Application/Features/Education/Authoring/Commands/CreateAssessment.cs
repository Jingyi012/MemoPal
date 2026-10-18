using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record CreateAssessmentCommand(string UserId, string CourseId, CreateAssessmentRequest Request) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class CreateAssessmentCommandHandler(IAppDbContext db) : IRequestHandler<CreateAssessmentCommand, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(CreateAssessmentCommand command, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct);
        var assessment = new EducationAssessment
        {
            CourseId = command.CourseId,
            UserId = command.UserId,
            Title = AuthoringValidation.Title(command.Request.Title, "Assessment")
        };
        db.EducationAssessments.Add(assessment);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(assessment));
    }
}
