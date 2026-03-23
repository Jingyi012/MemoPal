using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Configs.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record CreateLevelConfigCommand(LevelConfigUpsertRequest Request) : IRequest<ApiResponse<LevelConfigDto>>;

public sealed class CreateLevelConfigCommandHandler : IRequestHandler<CreateLevelConfigCommand, ApiResponse<LevelConfigDto>>
{
    private readonly IAppDbContext _db;

    public CreateLevelConfigCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LevelConfigDto>> Handle(CreateLevelConfigCommand request, CancellationToken cancellationToken)
    {
        if (request.Request.Level <= 0) throw new ValidationAppException("level must be greater than 0.");

        var now = DateTime.UtcNow;
        var entity = await _db.LevelConfigs.FirstOrDefaultAsync(x => x.Level == request.Request.Level, cancellationToken);
        if (entity is null)
        {
            entity = new LevelConfig
            {
                Level = request.Request.Level,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.LevelConfigs.AddAsync(entity, cancellationToken);
        }

        entity.RequiredXp = request.Request.RequiredXp;
        entity.Title = request.Request.Title;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<LevelConfigDto>();
        return ApiResponse<LevelConfigDto>.Ok(result);
    }
}

