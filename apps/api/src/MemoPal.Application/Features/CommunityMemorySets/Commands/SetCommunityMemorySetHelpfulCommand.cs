using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record SetCommunityMemorySetHelpfulCommand(string UserId, string MemorySetId, bool IsHelpful)
    : IRequest<ApiResponse<CommunityMemorySetReactionDto>>;

public sealed class SetCommunityMemorySetHelpfulCommandHandler(IAppDbContext db)
    : IRequestHandler<SetCommunityMemorySetHelpfulCommand, ApiResponse<CommunityMemorySetReactionDto>>
{
    public async Task<ApiResponse<CommunityMemorySetReactionDto>> Handle(
        SetCommunityMemorySetHelpfulCommand request,
        CancellationToken cancellationToken)
    {
        var memorySet = await db.MemorySets.AsNoTracking()
            .Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .Where(memory => db.Users.Any(author => author.Id == memory.UserId && !author.IsDeleted && author.AccountMode == MemoPal.Domain.Common.AccountMode.Standard))
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");
        if (memorySet.UserId == request.UserId)
            throw new ValidationAppException("You cannot react to your own memory set.");

        var reaction = await db.CommunityMemorySetReactions.FirstOrDefaultAsync(x =>
            x.UserId == request.UserId && x.MemorySetId == memorySet.Id, cancellationToken);
        if (request.IsHelpful)
        {
            if (reaction is null)
            {
                reaction = new CommunityMemorySetReaction { UserId = request.UserId, MemorySetId = memorySet.Id };
                db.CommunityMemorySetReactions.Add(reaction);
            }
            else if (reaction.IsDeleted)
            {
                reaction.IsDeleted = false;
                reaction.DeletedAt = null;
                reaction.DeletedBy = null;
            }
        }
        else if (reaction is { IsDeleted: false })
        {
            reaction.IsDeleted = true;
            reaction.DeletedAt = DateTime.UtcNow;
            reaction.DeletedBy = request.UserId;
        }

        await db.SaveChangesAsync(cancellationToken);
        var helpfulCount = await db.CommunityMemorySetReactions.CountAsync(x =>
            x.MemorySetId == memorySet.Id && !x.IsDeleted && db.Users.Any(u => u.Id == x.UserId && !u.IsDeleted && u.AccountMode == MemoPal.Domain.Common.AccountMode.Standard), cancellationToken);
        return ApiResponse<CommunityMemorySetReactionDto>.Ok(
            new CommunityMemorySetReactionDto(memorySet.Id, request.IsHelpful, helpfulCount));
    }
}
