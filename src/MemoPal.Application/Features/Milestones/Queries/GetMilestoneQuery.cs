using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestoneQuery(string UserId, string MilestoneId) : IRequest<ApiResponse<MilestoneDto>>;

public sealed class GetMilestoneQueryHandler : IRequestHandler<GetMilestoneQuery, ApiResponse<MilestoneDto>>
{
    private readonly IAppDbContext _db;

    public GetMilestoneQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MilestoneDto>> Handle(GetMilestoneQuery request, CancellationToken cancellationToken)
    {
        var definition = await _db.MilestoneDefinitions.FirstOrDefaultAsync(
                x => x.Id == request.MilestoneId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Milestone not found.");

        var achieved = await _db.UserMilestones.FirstOrDefaultAsync(
            x => x.UserId == request.UserId && x.MilestoneId == request.MilestoneId && !x.IsDeleted,
            cancellationToken);

        return ApiResponse<MilestoneDto>.Ok((definition, achieved).Adapt<MilestoneDto>());
    }
}




