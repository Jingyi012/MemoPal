using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Admin.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Admin.Commands;

public sealed record UpdateModerationItemCommand(string Type, string Id, AdminModerationUpdateRequest Request)
    : IRequest<ApiResponse<AdminModerationItemDto>>;

public sealed class UpdateModerationItemCommandHandler
    : IRequestHandler<UpdateModerationItemCommand, ApiResponse<AdminModerationItemDto>>
{
    private readonly IAppDbContext _db;

    public UpdateModerationItemCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<AdminModerationItemDto>> Handle(UpdateModerationItemCommand request, CancellationToken cancellationToken)
    {
        if (request.Type.Equals("palace", StringComparison.OrdinalIgnoreCase))
        {
            var entity = await _db.Palaces.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity is null) return ApiResponse<AdminModerationItemDto>.Fail("Palace not found.");

            if (request.Request.IsLocked.HasValue) entity.IsLocked = request.Request.IsLocked.Value;
            if (request.Request.IsDeleted.HasValue) entity.IsDeleted = request.Request.IsDeleted.Value;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return ApiResponse<AdminModerationItemDto>.Ok(new AdminModerationItemDto(
                entity.Id, "palace", entity.Name, entity.Description, entity.IsLocked, entity.IsDeleted, entity.CreatedAt, entity.CreatedBy));
        }

        if (request.Type.Equals("lesson", StringComparison.OrdinalIgnoreCase))
        {
            var entity = await _db.Lessons.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity is null) return ApiResponse<AdminModerationItemDto>.Fail("Lesson not found.");

            if (request.Request.IsLocked.HasValue) entity.IsLocked = request.Request.IsLocked.Value;
            if (request.Request.IsDeleted.HasValue) entity.IsDeleted = request.Request.IsDeleted.Value;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return ApiResponse<AdminModerationItemDto>.Ok(new AdminModerationItemDto(
                entity.Id, "lesson", entity.Title, entity.Description, entity.IsLocked ?? false, entity.IsDeleted, entity.CreatedAt, entity.CreatedBy));
        }

        return ApiResponse<AdminModerationItemDto>.Fail("Unsupported moderation type.");
    }
}
