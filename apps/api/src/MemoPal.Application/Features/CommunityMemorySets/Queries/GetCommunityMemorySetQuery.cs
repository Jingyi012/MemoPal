using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.MemorySets;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Queries;

public sealed record GetCommunityMemorySetQuery(string UserId, string MemorySetId)
    : IRequest<ApiResponse<CommunityMemorySetDetailDto>>;

public sealed class GetCommunityMemorySetQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCommunityMemorySetQuery, ApiResponse<CommunityMemorySetDetailDto>>
{
    public async Task<ApiResponse<CommunityMemorySetDetailDto>> Handle(
        GetCommunityMemorySetQuery request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets.AsNoTracking()
            .Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .Where(memory => db.Users.Any(author => author.Id == memory.UserId && !author.IsDeleted && author.AccountMode == MemoPal.Domain.Common.AccountMode.Standard))
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");
        var author = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == memorySet.UserId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");
        var copyCount = await db.MemorySets.CountAsync(x =>
            x.CopiedFromMemorySetId == memorySet.Id && !x.IsDeleted && db.Users.Any(u => u.Id == x.UserId && !u.IsDeleted && u.AccountMode == MemoPal.Domain.Common.AccountMode.Standard), cancellationToken);
        var helpfulCount = await db.CommunityMemorySetReactions.CountAsync(x =>
            x.MemorySetId == memorySet.Id && !x.IsDeleted && db.Users.Any(u => u.Id == x.UserId && !u.IsDeleted && u.AccountMode == MemoPal.Domain.Common.AccountMode.Standard), cancellationToken);
        var isHelpful = await db.CommunityMemorySetReactions.AnyAsync(x =>
            x.MemorySetId == memorySet.Id && x.UserId == request.UserId && !x.IsDeleted, cancellationToken);
        var isBookmarked = await db.CommunityMemorySetBookmarks.AnyAsync(x =>
            x.MemorySetId == memorySet.Id && x.UserId == request.UserId && !x.IsDeleted, cancellationToken);
        var existingCopyId = await db.MemorySets.AsNoTracking()
            .Where(x => x.UserId == request.UserId && x.CopiedFromMemorySetId == memorySet.Id && !x.IsDeleted && db.Users.Any(u => u.Id == x.UserId && !u.IsDeleted && u.AccountMode == MemoPal.Domain.Common.AccountMode.Standard))
            .Select(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (memorySet.UserId == request.UserId) existingCopyId = memorySet.Id;
        var coverImageUrl = memorySet.TechniquePlan?.PalaceSceneId is { } sceneId
            ? await db.PalaceScenes.AsNoTracking().Where(x => x.Id == sceneId).Select(x => x.ImageUrl)
                .FirstOrDefaultAsync(cancellationToken)
            : null;

        return ApiResponse<CommunityMemorySetDetailDto>.Ok(
            CommunityMemorySetMapper.ToDetail(memorySet, author, copyCount, helpfulCount, isHelpful, isBookmarked, existingCopyId, coverImageUrl));
    }
}
