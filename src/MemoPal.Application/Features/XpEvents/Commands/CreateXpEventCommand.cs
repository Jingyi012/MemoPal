using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.XpEvents.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.XpEvents.Commands;

public sealed record CreateXpEventCommand(string UserId, XpEventUpsertRequest Request) : IRequest<ApiResponse<XpEventDto>>;

public sealed class CreateXpEventCommandHandler : IRequestHandler<CreateXpEventCommand, ApiResponse<XpEventDto>>
{
    private readonly IAppDbContext _db;

    public CreateXpEventCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<XpEventDto>> Handle(CreateXpEventCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Request
            ?? throw new ValidationAppException("sourceType and clientEventId are required.");

        if (string.IsNullOrWhiteSpace(payload.SourceType) ||
            string.IsNullOrWhiteSpace(payload.ClientEventId))
        {
            throw new ValidationAppException("sourceType and clientEventId are required.");
        }

        if (payload.XpAmount <= 0)
        {
            throw new ValidationAppException("xpAmount must be greater than 0.");
        }

        var existing = await _db.XpEvents.FirstOrDefaultAsync(
            x => x.UserId == request.UserId &&
                 x.ClientEventId == payload.ClientEventId,
            cancellationToken);

        if (existing is not null)
        {
            return ApiResponse<XpEventDto>.Ok(existing.Adapt<XpEventDto>());
        }

        var now = DateTime.UtcNow;
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var entity = new XpEvent
        {
            Id = string.IsNullOrWhiteSpace(payload.Id) ? Guid.NewGuid().ToString("D") : payload.Id!,
            UserId = request.UserId,
            SourceType = payload.SourceType,
            SourceId = payload.SourceId,
            XpAmount = payload.XpAmount,
            ClientEventId = payload.ClientEventId,
            IsDeleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        user.TotalXp += entity.XpAmount;
        user.Level = await _db.LevelConfigs
            .Where(x => !x.IsDeleted && x.RequiredXp <= user.TotalXp)
            .OrderByDescending(x => x.RequiredXp)
            .ThenByDescending(x => x.Level)
            .Select(x => x.Level)
            .FirstOrDefaultAsync(cancellationToken);
        if (user.Level <= 0)
        {
            user.Level = 1;
        }
        user.UpdatedAt = now;

        await _db.XpEvents.AddAsync(entity, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<XpEventDto>.Ok(entity.Adapt<XpEventDto>());
    }
}
