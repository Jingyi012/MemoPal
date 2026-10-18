using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record SetCommunityMemorySetBookmarkCommand(string UserId, string MemorySetId, bool IsBookmarked)
    : IRequest<ApiResponse<CommunityMemorySetBookmarkDto>>;

public sealed class SetCommunityMemorySetBookmarkCommandHandler(IAppDbContext db)
    : IRequestHandler<SetCommunityMemorySetBookmarkCommand, ApiResponse<CommunityMemorySetBookmarkDto>>
{
    public async Task<ApiResponse<CommunityMemorySetBookmarkDto>> Handle(
        SetCommunityMemorySetBookmarkCommand request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets.AsNoTracking()
            .Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");

        var bookmark = await db.CommunityMemorySetBookmarks.FirstOrDefaultAsync(x =>
            x.UserId == request.UserId && x.MemorySetId == memorySet.Id, cancellationToken);
        if (request.IsBookmarked)
        {
            if (bookmark is null)
            {
                db.CommunityMemorySetBookmarks.Add(new CommunityMemorySetBookmark
                {
                    UserId = request.UserId,
                    MemorySetId = memorySet.Id,
                });
            }
            else if (bookmark.IsDeleted)
            {
                bookmark.IsDeleted = false;
                bookmark.DeletedAt = null;
                bookmark.DeletedBy = null;
            }
        }
        else if (bookmark is { IsDeleted: false })
        {
            bookmark.IsDeleted = true;
            bookmark.DeletedAt = DateTime.UtcNow;
            bookmark.DeletedBy = request.UserId;
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<CommunityMemorySetBookmarkDto>.Ok(
            new CommunityMemorySetBookmarkDto(memorySet.Id, request.IsBookmarked));
    }
}
