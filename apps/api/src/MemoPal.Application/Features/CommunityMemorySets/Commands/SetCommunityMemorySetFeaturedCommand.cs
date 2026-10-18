using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record SetCommunityMemorySetFeaturedCommand(string MemorySetId, bool Featured)
    : IRequest<ApiResponse<bool>>;

public sealed class SetCommunityMemorySetFeaturedCommandHandler(IAppDbContext db)
    : IRequestHandler<SetCommunityMemorySetFeaturedCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        SetCommunityMemorySetFeaturedCommand request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets.FirstOrDefaultAsync(x =>
            x.Id == request.MemorySetId && !x.IsDeleted &&
            x.Visibility == MemorySetVisibilities.Public && x.PublishedAt != null,
            cancellationToken)
            ?? throw new NotFoundAppException("Community memory set not found.");

        if (request.Featured && memorySet.CommunityStatus != MemorySetCommunityStatuses.Visible)
            throw new ValidationAppException("Hidden community memory sets cannot be featured.");

        memorySet.FeaturedAt = request.Featured ? DateTime.UtcNow : null;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
