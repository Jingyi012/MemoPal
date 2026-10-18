using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetEducationAssignmentQuery(string UserId, string AssignmentId)
    : IRequest<ApiResponse<EducationAssignmentDto>>;

public sealed class GetEducationAssignmentHandler(IAppDbContext db)
    : IRequestHandler<GetEducationAssignmentQuery, ApiResponse<EducationAssignmentDto>>
{
    public async Task<ApiResponse<EducationAssignmentDto>> Handle(GetEducationAssignmentQuery q, CancellationToken ct)
    {
        var assignment = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
            .FirstOrDefaultAsync(x => x.Id == q.AssignmentId && x.CreatorUserId == q.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assignment not found.");
        return ApiResponse<EducationAssignmentDto>.Ok(AssignmentValidation.ToDto(assignment));
    }
}
