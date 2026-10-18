using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record ModerateCommunityMemorySetCommand(string MemorySetId, bool Hidden, string? Reason)
    : IRequest<ApiResponse<bool>>;

public sealed class ModerateCommunityMemorySetCommandHandler(IAppDbContext db)
    : IRequestHandler<ModerateCommunityMemorySetCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        ModerateCommunityMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets.FirstOrDefaultAsync(x =>
            x.Id == request.MemorySetId &&
            !x.IsDeleted &&
            x.Visibility == MemorySetVisibilities.Public &&
            x.PublishedAt != null,
            cancellationToken)
            ?? throw new NotFoundAppException("Community memory set not found.");
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        if (reason?.Length > 500) throw new ValidationAppException("Hide reason cannot exceed 500 characters.");

        memorySet.CommunityStatus = request.Hidden
            ? MemorySetCommunityStatuses.Hidden
            : MemorySetCommunityStatuses.Visible;
        if (request.Hidden) memorySet.FeaturedAt = null;
        memorySet.HiddenAt = request.Hidden ? DateTime.UtcNow : null;
        memorySet.HiddenReason = request.Hidden ? reason : null;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
