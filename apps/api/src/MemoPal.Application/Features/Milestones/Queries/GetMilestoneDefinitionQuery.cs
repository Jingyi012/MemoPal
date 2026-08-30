using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Queries;

public sealed record GetMilestoneDefinitionQuery(string MilestoneId) : IRequest<ApiResponse<MilestoneDefinitionDto>>;

public sealed class GetMilestoneDefinitionQueryHandler : IRequestHandler<GetMilestoneDefinitionQuery, ApiResponse<MilestoneDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public GetMilestoneDefinitionQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MilestoneDefinitionDto>> Handle(GetMilestoneDefinitionQuery request, CancellationToken cancellationToken)
    {
        var entity = await _db.MilestoneDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.MilestoneId &&
                     !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Milestone definition not found.");

        return ApiResponse<MilestoneDefinitionDto>.Ok(entity.Adapt<MilestoneDefinitionDto>());
    }
}

