using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetMyFamilyAssignmentsQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<EducationAssignmentDto>>>;

public sealed class GetMyFamilyAssignmentsHandler(IAppDbContext db)
    : IRequestHandler<GetMyFamilyAssignmentsQuery, ApiResponse<IReadOnlyList<EducationAssignmentDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationAssignmentDto>>> Handle(GetMyFamilyAssignmentsQuery q, CancellationToken ct)
    {
        var assignments = await db.EducationAssignments.AsNoTracking().Include(x => x.Recipients)
            .Where(x => x.CreatorUserId == q.UserId && x.Scope == EducationAssignmentScopes.Family && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationAssignmentDto>>.Ok(assignments.Select(AssignmentValidation.ToDto).ToArray());
    }
}
