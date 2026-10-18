using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record GetAssessmentQuery(string UserId, string AssessmentId) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class GetAssessmentQueryHandler(IAppDbContext db) : IRequestHandler<GetAssessmentQuery, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(GetAssessmentQuery query, CancellationToken ct)
    {
        var assessment = await AuthoringValidation.OwnedAssessment(db, query.UserId, query.AssessmentId, ct);
        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(assessment));
    }
}
