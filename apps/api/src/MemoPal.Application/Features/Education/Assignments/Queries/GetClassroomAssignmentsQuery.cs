using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetClassroomAssignmentsQuery(string UserId, string ClassroomId)
    : IRequest<ApiResponse<IReadOnlyList<EducationAssignmentDto>>>;

public sealed class GetClassroomAssignmentsHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetClassroomAssignmentsQuery, ApiResponse<IReadOnlyList<EducationAssignmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationAssignmentDto>>> Handle(GetClassroomAssignmentsQuery q, CancellationToken ct)
    {
        if (!await access.IsActiveClassTeacherAsync(q.UserId, q.ClassroomId, ct))
            throw new NotFoundAppException("Classroom not found.");
        var assignments = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
            .Where(x => x.CreatorUserId == q.UserId && x.ClassroomId == q.ClassroomId && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationAssignmentDto>>.Ok(assignments.Select(AssignmentValidation.ToDto).ToArray());
    }
}
