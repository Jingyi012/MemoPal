using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record GetAssessmentsQuery(string UserId, string CourseId) : IRequest<ApiResponse<IReadOnlyList<EducationAssessmentDto>>>;

public sealed class GetAssessmentsQueryHandler(IAppDbContext db) : IRequestHandler<GetAssessmentsQuery, ApiResponse<IReadOnlyList<EducationAssessmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationAssessmentDto>>> Handle(GetAssessmentsQuery query, CancellationToken ct)
    {
        await AuthoringValidation.OwnedCourse(db, query.UserId, query.CourseId, ct);
        var assessments = await db.EducationAssessments.AsNoTracking().Include(assessment => assessment.Questions)
            .Where(assessment => assessment.UserId == query.UserId && assessment.CourseId == query.CourseId && !assessment.IsDeleted)
            .OrderByDescending(assessment => assessment.UpdatedAt)
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationAssessmentDto>>.Ok(assessments.Select(EducationAuthoringMapper.ToDto).ToArray());
    }
}
