using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record LogoutCommand(
    string UserId,
    string? RefreshToken = null,
    string? DeviceId = null,
    bool LogoutAllDevices = false) : IRequest<ApiResponse<bool>>;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand, ApiResponse<bool>>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public LogoutCommandHandler(IAppDbContext db, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ApiResponse<bool>> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        if (request.LogoutAllDevices)
        {
            await AuthSessionManager.RevokeAllActiveSessionsAsync(
                _db,
                request.UserId,
                "logout_all_devices",
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Ok(true, "Signed out from all devices.");
        }

        var revoked = false;

        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var refreshTokenHash = _tokenGenerator.HashRefreshToken(request.RefreshToken);
            var session = await _db.RefreshTokenSessions
                .FirstOrDefaultAsync(
                    x => x.UserId == request.UserId &&
                         x.TokenHash == refreshTokenHash &&
                         !x.IsDeleted,
                    cancellationToken);

            if (session is not null && session.RevokedAt is null)
            {
                session.RevokedAt = now;
                session.RevokedReason = "logout";
                session.UpdatedAt = now;
                revoked = true;
            }
        }

        if (!revoked && !string.IsNullOrWhiteSpace(request.DeviceId))
        {
            var normalizedDeviceId = AuthSessionManager.NormalizeDeviceId(request.DeviceId);
            await AuthSessionManager.RevokeActiveSessionsForDeviceAsync(
                _db,
                request.UserId,
                normalizedDeviceId,
                "logout",
                cancellationToken);
            revoked = true;
        }

        if (!revoked)
        {
            await AuthSessionManager.RevokeAllActiveSessionsAsync(
                _db,
                request.UserId,
                "logout_fallback_all_devices",
                cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Signed out successfully.");
    }
}
