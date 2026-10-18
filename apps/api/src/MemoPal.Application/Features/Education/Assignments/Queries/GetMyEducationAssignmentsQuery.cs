using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetMyEducationAssignmentsQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<MyEducationAssignmentDto>>>;

public sealed class GetMyEducationAssignmentsHandler(IAppDbContext db)
    : IRequestHandler<GetMyEducationAssignmentsQuery, ApiResponse<IReadOnlyList<MyEducationAssignmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<MyEducationAssignmentDto>>> Handle(GetMyEducationAssignmentsQuery q, CancellationToken ct)
    {
        var rows = await (
            from recipient in db.EducationAssignmentRecipients.AsNoTracking()
            where recipient.StudentUserId == q.UserId && !recipient.IsDeleted &&
                  recipient.Assignment != null && !recipient.Assignment.IsDeleted
            let assessment = db.EducationAssessments.AsNoTracking().FirstOrDefault(x =>
                x.Id == recipient.AssessmentId && !x.IsDeleted)
            let course = assessment == null ? null : db.EducationCourses.AsNoTracking().FirstOrDefault(x =>
                x.Id == assessment.CourseId && !x.IsDeleted)
            orderby recipient.OpensAt
            select new MyEducationAssignmentDto(recipient.AssignmentId, recipient.AssessmentId, recipient.AssessmentVersion,
                course == null ? null : course.Id, course == null ? null : course.Title,
                recipient.Title, recipient.OpensAt, recipient.DueAt, recipient.TimeLimitMinutes,
                recipient.Assignment!.Scope, recipient.Assignment.ClassroomId, recipient.Assignment.StudentLeaderboardEnabled,
                recipient.IncludeInStudentLeaderboard, recipient.Assignment.ResultsPublishedAt))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<MyEducationAssignmentDto>>.Ok(rows);
    }
}
