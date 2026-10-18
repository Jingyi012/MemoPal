using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts.DTOs;

namespace MemoPal.Application.Features.Education.Attempts.Queries;

public sealed record GetEducationAssessmentAttemptQuery(string UserId, string AttemptId)
    : IRequest<ApiResponse<EducationAssessmentAttemptDto>>;

public sealed class GetEducationAssessmentAttemptHandler(IAppDbContext db)
    : IRequestHandler<GetEducationAssessmentAttemptQuery, ApiResponse<EducationAssessmentAttemptDto>>
{
    public async Task<ApiResponse<EducationAssessmentAttemptDto>> Handle(GetEducationAssessmentAttemptQuery q, CancellationToken ct)
    {
        var attempt = await EducationAttemptValidation.OwnedAttemptAsync(db, q.UserId, q.AttemptId, ct);
        var assessment = await EducationAttemptValidation.PublishedSnapshotAsync(db, attempt, ct);
        return ApiResponse<EducationAssessmentAttemptDto>.Ok(EducationAttemptMapping.ToDto(attempt, assessment));
    }
}
