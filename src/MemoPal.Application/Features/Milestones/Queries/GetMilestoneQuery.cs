using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Domain.Entities;
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

        return ApiResponse<MilestoneDto>.Ok(ToMilestoneDto(definition, achieved));
    }

    private static MilestoneDto ToMilestoneDto(MilestoneDefinition definition, UserMilestone? achieved)
    {
        return new MilestoneDto(
            definition.Id,
            definition.Key,
            definition.Title,
            definition.Description,
            definition.ConditionType,
            definition.ConditionValue,
            achieved?.AchievedAt,
            definition.CreatedAt,
            definition.UpdatedAt,
            definition.IsDeleted,
            definition.DeletedAt);
    }
}




