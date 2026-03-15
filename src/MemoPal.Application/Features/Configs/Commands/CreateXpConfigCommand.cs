using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record CreateXpConfigCommand(XpConfigUpsertRequest Request) : IRequest<XpConfigDto>;

public sealed class CreateXpConfigCommandHandler : IRequestHandler<CreateXpConfigCommand, XpConfigDto>
{
    private readonly IAppDbContext _db;

    public CreateXpConfigCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<XpConfigDto> Handle(CreateXpConfigCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.SourceType))
            throw new ValidationAppException("sourceType is required.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;
        var entity = await _db.XpConfigs.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new XpConfig
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.XpConfigs.AddAsync(entity, cancellationToken);
        }

        entity.SourceType = request.Request.SourceType!;
        entity.BaseXp = request.Request.BaseXp;
        entity.VariableXp = request.Request.VariableXp;
        entity.IsActive = request.Request.IsActive;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<XpConfigDto>();
    }
}

