using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Companion.Commands;
using MemoPal.Application.Features.Companion.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Companion.Queries;

public sealed record GetCompanionLookPresetsQuery(string UserId)
    : IRequest<ApiResponse<IReadOnlyList<CompanionLookPresetDto>>>;

public sealed class GetCompanionLookPresetsQueryHandler(IAppDbContext db)
    : IRequestHandler<GetCompanionLookPresetsQuery, ApiResponse<IReadOnlyList<CompanionLookPresetDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CompanionLookPresetDto>>> Handle(GetCompanionLookPresetsQuery request, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().Where(x => x.Id == request.UserId && !x.IsDeleted)
            .Select(x => new { x.CompanionAvatarId, x.Level }).FirstOrDefaultAsync(ct);
        var avatarId = await GetCompanionQueryHandler.ResolveAvatarId(db, user?.CompanionAvatarId, user?.Level ?? 1, ct);
        var presets = string.IsNullOrWhiteSpace(avatarId) ? [] : await db.CompanionLookPresets.AsNoTracking()
            .Where(x => x.UserId == request.UserId && x.AvatarId == avatarId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)
            .Select(x => CreateCompanionLookPresetCommandHandler.ToDto(x)).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<CompanionLookPresetDto>>.Ok(presets);
    }
}
