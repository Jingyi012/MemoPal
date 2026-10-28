using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Queries;

public sealed record GetEducationGuidedLearningSessionQuery(string UserId, string SessionId, string? ClassroomId = null)
    : IRequest<ApiResponse<EducationGuidedLearningSessionDto>>;

public sealed class GetEducationGuidedLearningSessionHandler(IAppDbContext db)
    : IRequestHandler<GetEducationGuidedLearningSessionQuery, ApiResponse<EducationGuidedLearningSessionDto>>
{
    public async Task<ApiResponse<EducationGuidedLearningSessionDto>> Handle(GetEducationGuidedLearningSessionQuery query, CancellationToken ct)
    {
        var session = await db.EducationGuidedLearningSessions.AsNoTracking().Include(item => item.Questions)
            .FirstOrDefaultAsync(item => item.Id == query.SessionId && item.UserId == query.UserId && !item.IsDeleted, ct)
            ?? throw new NotFoundAppException("Guided learning session not found.");
        var content = await EducationGuidedLearningContentReader.ReadLessonAsync(db, query.UserId,
            session.CourseId, session.AssessmentId, ct, query.ClassroomId);
        EducationGuidedLearningContentReader.ValidateSessionContent(session, content);
        return ApiResponse<EducationGuidedLearningSessionDto>.Ok(
            EducationGuidedLearningMapper.ToSessionDto(content, session, session.Questions));
    }
}
