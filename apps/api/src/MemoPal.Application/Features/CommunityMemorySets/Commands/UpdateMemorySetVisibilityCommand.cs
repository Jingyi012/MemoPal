using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record UpdateMemorySetVisibilityCommand(
    string UserId,
    string MemorySetId,
    string Visibility,
    bool ConfirmPrivateAssets = false)
    : IRequest<ApiResponse<MemorySetDto>>;

public sealed class UpdateMemorySetVisibilityCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdateMemorySetVisibilityCommand, ApiResponse<MemorySetDto>>
{
    public async Task<ApiResponse<MemorySetDto>> Handle(
        UpdateMemorySetVisibilityCommand request,
        CancellationToken cancellationToken)
    {
        await AccountRestrictions.RequirePrivateAsync(db, request.UserId, request.Visibility, cancellationToken);
        if (request.Visibility is not (MemorySetVisibilities.Private or MemorySetVisibilities.Public))
            throw new ValidationAppException("Visibility must be private or public.");

        var memorySet = await db.ForUser(request.UserId).WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        var sharesPrivateAssets = false;
        if (request.Visibility == MemorySetVisibilities.Public)
        {
            sharesPrivateAssets = await CommunityMemorySetPublishingValidator.ValidateAsync(
                db,
                memorySet,
                request.ConfirmPrivateAssets || memorySet.SharesPrivateAssets,
                cancellationToken);
        }

        if (memorySet.Visibility != request.Visibility)
        {
            memorySet.Visibility = request.Visibility;
            if (request.Visibility != MemorySetVisibilities.Public)
                memorySet.FeaturedAt = null;
            memorySet.SharesPrivateAssets = request.Visibility == MemorySetVisibilities.Public && sharesPrivateAssets;
            if (request.Visibility == MemorySetVisibilities.Public)
                memorySet.PublishedAt ??= DateTime.UtcNow;
            memorySet.Version += 1;
            await db.SaveChangesAsync(cancellationToken);
        }
        else if (request.Visibility == MemorySetVisibilities.Public &&
                 memorySet.SharesPrivateAssets != sharesPrivateAssets)
        {
            memorySet.SharesPrivateAssets = sharesPrivateAssets;
            memorySet.Version += 1;
            await db.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(memorySet));
    }

}
